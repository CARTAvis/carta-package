#!/bin/bash -e
### Script to create a distributable carta_backend on CentOS7
### Updated 11-5-2022

export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
export LD_LIBRARY_PATH=/usr/lib64:$LD_LIBRARY_PATH

# Make carta_backend distributable
# If built on CentOS6, it will be distributable on CentOS7 and CentOS8.
# (It should also work on other RHEL 7 and 8 based systems too)
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

# Extra: Copy over some missed library files
cp /opt/carta-casacore/lib/libcasa_scimath_f.so.6 lib/
cp /usr/lib64/libhdf5_hl.so.8 lib/
cp /usr/lib64/liblapack.so.3 lib/
cp /usr/lib64/libblas.so.3 lib/
#cp /usr/lib64/libgsl.so.0 lib/
#cp /usr/lib64/libgslcblas.so.0 lib/
cp /opt/carta-gsl/lib/libgslcblas.so.0 lib/
cp /usr/lib64/libgfortran.so.5 lib/
cp /usr/lib64/libquadmath.so.0 lib/
cp /usr/lib64/libgfortran.so.3 lib/
#cp /lib64/atlas/libsatlas.so.3 lib/
#cp /usr/lib64/libprofiler.so.0 lib/
cp /usr/lib64/libwcs.so.4 lib/
#cp /usr/lib64/libgpr.so.7 lib/
#cp /usr/lib64/libcares.so.2 lib/

# Extra library files to allow it to run on Ubuntu 20.04, 18.04, Debian 10, Fedora 32
cp /usr/lib64/libidn.so.11 lib/
cp /usr/lib64/libtinfo.so.5 lib/
cp /usr/lib64/libreadline.so.6 lib/
cp /usr/lib64/libncurses.so.5 lib/
cp /usr/lib64/libnsl.so.1 lib/
cp /usr/lib64/libssh2.so.1 lib/
cp /usr/lib64/libssl.so.10 lib/
cp /usr/lib64/libcrypto.so.10 lib/
cp /usr/lib64/libsmime3.so lib/

# Extra library files to allow it to work in a Docker container
#cp /usr/lib64/libcares.so.2 lib/
cp /usr/lib64/libssl3.so lib/
#cp /usr/lib64/libnss3.so lib/
#cp /usr/lib64/libnssutil3.so lib/
cp /usr/lib64/libplds4.so lib/
cp /usr/lib64/libplc4.so lib/
cp /usr/lib64/libnspr4.so lib/
cp /usr/lib64/libgssapi_krb5.so.2 lib/
cp /usr/lib64/libkrb5.so.3 lib/
cp /usr/lib64/libk5crypto.so.3 lib/
cp /usr/lib64/liblber-2.4.so.2 lib/
cp /usr/lib64/libldap-2.4.so.2 lib/
cp /usr/lib64/libkrb5support.so.0 lib/
cp /usr/lib64/libkeyutils.so.1 lib/
cp /usr/lib64/libsasl2.so.3 lib/
cp /usr/lib64/libcrypt.so.1 lib/
cp /usr/lib64/libfreebl3.so lib/

# Remove some library files to make it universal
rm lib/libz.so.1
rm lib/libstdc++.so.6
rm lib/libc.so.6
rm lib/libdl.so.2
rm lib/libgcc_s.so.1
rm lib/libm.so.6
rm lib/libpthread.so.0

