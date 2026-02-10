#!/bin/bash

. ${DOCKER_PACKAGING_PATH}/appimage_config

mkdir -p ${DOCKER_PACKAGING_PATH}/CARTA/bin 
cp ${DOCKER_PACKAGING_PATH}/carta-backend/build/carta_backend ${DOCKER_PACKAGING_PATH}/CARTA/bin 
patchelf --set-rpath "\$ORIGIN/lib" ${DOCKER_PACKAGING_PATH}/CARTA/bin/carta_backend 
mkdir -p ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libaec.so.0 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libblas.so.3 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_casa.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_coordinates.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_derivedmscal.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_fits.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_imageanalysis.so.6 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_images.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_lattices.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_meas.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_measures.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_mirlib.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_msfits.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_ms.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_scimath.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_scimath_f.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/carta-casacore/lib/libcasa_tables.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /opt/cfitsio/lib/libcfitsio.so.10 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libgfortran.so.5 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libgomp.so.1 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libfftw3.so.3 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libfftw3_threads.so.3 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libfftw3f_threads.so.3 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libfftw3f.so.3 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libgsl.so.23 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libgslcblas.so.0 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libhdf5.so.103 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libhdf5_cpp.so.103 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libhdf5_hl.so.100 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/liblapack.so.3 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libncurses.so.6 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libprotobuf.so.15 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libpugixml.so.1 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libreadline.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libsz.so.2 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libtinfo.so.6 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libwcs.so.7 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libzfp.so.0 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
cp /usr/lib64/libzstd.so.1 ${DOCKER_PACKAGING_PATH}/CARTA/lib 
if [ $(arch) = "x86_64" ]; then cp /usr/lib64/libquadmath.so.0 ${DOCKER_PACKAGING_PATH}/CARTA/lib; fi

# copy some additional files
cp /opt/carta-casacore/bin/casa_data_autoupdate ${DOCKER_PACKAGING_PATH}/CARTA/bin
mkdir -p ${DOCKER_PACKAGING_PATH}/CARTA/etc
cp -r /usr/local/share/casacore/data ${DOCKER_PACKAGING_PATH}/CARTA/etc
mkdir -p ${DOCKER_PACKAGING_PATH}/CARTA/share/carta/frontend
cp -r ${DOCKER_PACKAGING_PATH}/package/build/* ${DOCKER_PACKAGING_PATH}/CARTA/share/carta/frontend/
mkdir -p ${DOCKER_PACKAGING_PATH}/CARTA/usr/share/icons/hicolor/256x256/apps
mkdir -p ${DOCKER_PACKAGING_PATH}/CARTA/usr/share/icons/hicolor/128x128/apps
cp -r ${DOCKER_PACKAGING_PATH}/carta-backend/static/icons/256x256/cartaviewer.png ${DOCKER_PACKAGING_PATH}/CARTA/usr/share/icons/hicolor/256x256/apps/
cp -r ${DOCKER_PACKAGING_PATH}/carta-backend/static/icons/128x128/cartaviewer.png ${DOCKER_PACKAGING_PATH}/CARTA/usr/share/icons/hicolor/128x128/apps/
mkdir -p ${DOCKER_PACKAGING_PATH}/CARTA/usr/share/metainfo

