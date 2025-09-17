#!/bin/bash

BACKEND_BUILD_PATH=$1
cd $BACKEND_BUILD_PATH

APP="./carta_backend"
LIBDIR="./libs"
CUSTOM_LIB_PATH="/usr/local/lib"  # where libzfp.1.dylib lives

mkdir -p "$LIBDIR"

# Get the executable's directory without using realpath
EXEC_PATH="./carta_backend"
EXEC_DIR=$(cd "$(dirname "$EXEC_PATH")" && pwd)
echo "Executable directory: $EXEC_DIR"

# Function to extract library path from otool output
extract_path() {
    local lib="$1"
    local path=$(otool -L "$lib" | head -n 2 | tail -n 1 | awk '{print $1}')
    
    # Remove the library name to get just the directory
    if [[ "$path" == /* ]]; then
        # It's a full path
        dirname "$path"
    else
        # It's either @rpath or relative - just return empty
        echo ""
    fi
}

# Function to find the actual path for an @rpath reference
resolve_rpath() {
    local binary=$1
    local rpath_lib=$2
    local lib_name=$(basename "$rpath_lib")
    
    # Get the RPATHs from the binary
    local rpaths=$(otool -l "$binary" | grep -A2 LC_RPATH | grep "path" | awk '{print $2}')
    
    # Extract path from the binary itself if it's a library
    local extracted_path=$(extract_path "$binary")
    if [ -n "$extracted_path" ]; then
        rpaths="$rpaths $extracted_path"
    fi

    # If no RPATHs found, try looking in common locations
    if [ -z "$rpaths" ]; then
        rpaths="$EXEC_DIR $EXEC_DIR/../Frameworks $EXEC_DIR/lib $EXEC_DIR/../lib /usr/local/lib"
    fi

    # Try each RPATH to find the library
    for rpath in $rpaths; do
        # Replace @executable_path if present
        rpath="${rpath/@executable_path/$EXEC_DIR}"
        
        # Check if library exists at this rpath
        if [ -f "$rpath/$lib_name" ]; then
            echo "$rpath/$lib_name"
            return 0
        fi
    done
    
    # Also check in common system locations
    for path in "/usr/local/lib" "/opt/local/lib" "/usr/lib"; do
        if [ -f "$path/$lib_name" ]; then
            echo "$path/$lib_name"
            return 0
        fi
    done
    
    # Library not found
    echo ""
    return 1
}

# Instead of an associative array, we'll use a simple file to track processed libraries
PROCESSED_FILE=$(mktemp)

# Function to check if a library has been processed
is_processed() {
    grep -q "^$1$" "$PROCESSED_FILE" 2>/dev/null
    return $?
}

# Function to mark a library as processed
mark_processed() {
    echo "$1" >> "$PROCESSED_FILE"
}

# Function to recursively copy dependencies
copy_dependencies() {
    local binary=$1
    
    # Mark this binary as processed
    local bin_path=$(cd "$(dirname "$binary")" && pwd)/$(basename "$binary")
    mark_processed "$bin_path"
    
    local deps=$(otool -L "$binary" | tail -n +2 | awk '{print $1}' | grep -v "^/System" | grep -v "^/usr/lib")
    
    for dep in $deps; do
        local depname=$(basename "$dep")
        
        # Skip if we've already copied this dependency
        if [ ! -f "libs/$depname" ]; then
            # Resolve @rpath if needed
            if [[ "$dep" == @rpath* ]]; then
                echo "Resolving @rpath for $dep from $(basename "$binary")"
                resolved_path=$(resolve_rpath "$binary" "$dep")
                if [ -n "$resolved_path" ]; then
                    echo "Resolved $dep to $resolved_path"
                    dep=$resolved_path
                else
                    echo "Warning: Could not resolve @rpath for $dep"
                    continue
                fi
            fi
            
            if [ -f "$dep" ]; then
                echo "Copying $dep to libs/$depname"
                cp "$dep" libs/
                # Process dependencies of this dependency if not already processed
                if ! is_processed "$dep"; then
                    copy_dependencies "$dep"
                fi
            else
                echo "Warning: Could not find dependency: $dep"
            fi
        elif ! is_processed "libs/$depname"; then
            # We've already copied this lib but haven't processed its dependencies
            echo "Processing dependencies of already copied lib: $depname"
            # Process dependencies of this library
            mark_processed "libs/$depname"
            copy_dependencies "libs/$depname"
        fi
    done
}

# Start the recursive copy process with the main binary
copy_dependencies "./carta_backend"

# Process all libraries in the libs directory to ensure complete dependency resolution
echo "Performing second pass to ensure all dependencies are resolved..."
for lib in libs/*; do
    if [ -f "$lib" ]; then
        if ! is_processed "$lib"; then
            echo "Processing dependencies of: $lib"
            copy_dependencies "$lib"
        fi
    fi
done

# Clean up temp file
rm -f "$PROCESSED_FILE"

echo "All dependencies copied to 'libs' folder"


for lib in libs/*; do
    libname=$(basename "$lib")
    install_name_tool -change "$(otool -D "$lib" | tail -n +2)" "@executable_path/../libs/$libname" carta_backend
done

for lib in libs/*; do
    libname=$(basename "$lib")
    otool -L "$lib" | awk 'NR>1 {print $1}' | while read dep; do
        if [[ "$dep" == /usr/lib/* || "$dep" == /System/* ]]; then
            continue
        fi
        depname=$(basename "$dep")
        if [ -f "libs/$depname" ]; then
            install_name_tool -change "$dep" "@loader_path/../libs/$depname" "$lib"
        fi
    done
done


codesign --force --sign - carta_backend
for lib in libs/*; do
    codesign --force --sign - "$lib"
done

