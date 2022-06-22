#!/bin/bash -e
### Script to create a distributable carta_backend on Ubuntu
### Updated 11-5-2022

export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
export LD_LIBRARY_PATH=/usr/lib64:$LD_LIBRARY_PATH

# Taken from here https://unix.stackexchange.com/a/289896
# Run as "./package.sh carta_backend"

[ -n "$1" ] || set -- a.out
mkdir -p ./lib/

# use ldd to resolve the libs and use `patchelf --print-needed to filter out
# "magic" libs kernel-interfacing libs such as linux-vdso.so, ld-linux-x86-65.so or libpthread
# which you probably should not relativize anyway
join \
    <(ldd "$1" |awk '{if(substr($3,0,1)=="/") print $1,$3}' |sort) \
    <(patchelf --print-needed "$1" |sort) |cut -d\  -f2 |

#copy the lib selection to ./lib
xargs -d '\n' -I{} cp --copy-contents {} ./lib

#make the relative lib paths override the system lib path
patchelf --set-rpath "\$ORIGIN/lib" "$1"

# Extra:
cp /usr/lib/x86_64-linux-gnu/libssl.so.1.1 lib/
cp /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1 lib/
##cp /usr/lib/x86_64-linux-gnu/libcares.so.2 lib/
cp /usr/lib/x86_64-linux-gnu/libnghttp2.so.14 lib/
cp /usr/lib/x86_64-linux-gnu/librtmp.so.1 lib/
cp /usr/lib/x86_64-linux-gnu/libpsl.so.5 lib/
cp /usr/lib/x86_64-linux-gnu/libgssapi_krb5.so.2 lib/
cp /usr/lib/x86_64-linux-gnu/libldap_r-2.4.so.2 lib/
cp /usr/lib/x86_64-linux-gnu/liblber-2.4.so.2 lib/
cp /usr/lib/x86_64-linux-gnu/liblber-2.4.so.2 lib/
cp /opt/carta-casacore/lib/libcasa_scimath_f.so.6 lib/
cp /usr/lib/x86_64-linux-gnu/libfftw3f_threads.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/libfftw3_threads.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/libfftw3f.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/libfftw3.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/libgsl.so.23 lib/
cp /usr/lib/x86_64-linux-gnu/libgslcblas.so.0 lib/
cp /usr/lib/x86_64-linux-gnu/libsz.so.2 lib/
cp /usr/lib/x86_64-linux-gnu/liblapack.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/libkrb5.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/libk5crypto.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/libkrb5support.so.0 lib/
cp /usr/lib/x86_64-linux-gnu/libsasl2.so.2 lib/
cp /usr/lib/x86_64-linux-gnu/libgssapi.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/liblapack.so.3 lib/
cp /usr/lib/x86_64-linux-gnu/libgfortran.so.4 lib/
cp /usr/lib/x86_64-linux-gnu/libaec.so.0 lib/
cp /usr/lib/x86_64-linux-gnu/libblas.so.3 lib/
cp /lib/x86_64-linux-gnu/libkeyutils.so.1 lib/
cp /usr/lib/x86_64-linux-gnu/libheimntlm.so.0 lib/
cp /usr/lib/x86_64-linux-gnu/libkrb5.so.26 lib/
cp /usr/lib/x86_64-linux-gnu/libasn1.so.8 lib/
cp /usr/lib/x86_64-linux-gnu/libhcrypto.so.4 lib/
cp /usr/lib/x86_64-linux-gnu/libroken.so.18 lib/
cp /usr/lib/x86_64-linux-gnu/libquadmath.so.0 lib/
cp /usr/lib/x86_64-linux-gnu/libwind.so.0 lib/
cp /usr/lib/x86_64-linux-gnu/libheimbase.so.1 lib/
cp /usr/lib/x86_64-linux-gnu/libhx509.so.5 lib/
cp /usr/lib/x86_64-linux-gnu/libsqlite3.so.0 lib/
#cp /usr/lib/x86_64-linux-gnu/libbz2.so.1.0 lib/

cp /opt/carta-casacore/lib/libcasa_casa.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_coordinates.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_tables.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_images.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_lattices.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_fits.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_measures.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_mirlib.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_scimath.so.6 lib/
cp /opt/carta-casacore/lib/libcasa_imageanalysis.so.3 lib/

cp /usr/lib/x86_64-linux-gnu/libnettle.so.6 lib/
cp /usr/lib/x86_64-linux-gnu/libhogweed.so.4 lib/

# Remove some library files to make it universal
rm lib/libz.so.1
rm lib/libstdc++.so.6
rm lib/libc.so.6
rm lib/libgcc_s.so.1
rm lib/libm.so.6
rm lib/libpthread.so.0
