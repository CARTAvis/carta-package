%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build
%define my_prefix  %{_prefix}

Name:           carta-casacore
Version:        3.4.0+6.5.0+2022.5.11
Release:        5
Summary:        carta-casacore library files as needed by the CARTA image viewer

License:        GPL-3+
URL:            https://github.com/CARTAvis/carta-casacore
Source0:        %{name}-%{version}.tar.gz

BuildArch: %{_arch}

BuildRequires:  bison
BuildRequires:  cfitsio-devel
BuildRequires:  cmake
BuildRequires:  curl-devel
BuildRequires:  fftw-devel
BuildRequires:  flex

%if 0%{?suse_version} >= 1500
BuildRequires:  gcc9-c++
BuildRequires:  gcc9-fortran
%else
BuildRequires:  gcc-c++
%endif

BuildRequires:  hdf5-devel
BuildRequires:  lapack-devel
BuildRequires:  pkgconfig
BuildRequires:  readline-devel
BuildRequires:  wcslib-devel

# Only el7 requires carta-gsl-devel and newer devtoolset
%if 0%{?rhel} == 7
BuildRequires: carta-gsl-devel
BuildRequires: devtoolset-8-gcc-c++
Requires: carta-gsl
%else
BuildRequires: gsl-devel
%endif

Requires: measures-data

%define _lib /lib
%define NVdir %{name}-%{version}

%description
The casacore and casacode image analysis library files (carta-casacore).
Required to run the CARTA image viewer (https://cartavis.org).

%package devel
#Requires:
Summary: carta-casacore library and header files for CARTA image viewer development
Provides: carta-casacore-devel

%description devel
The casacore and casacode image analysis development packages (carta-casacore).
Required to develop the CARTA image viewer (https://cartavis.org).

%prep
rm -rf %{NVdir}
git clone %{url}.git %{NVdir} --recursive
cd %{NVdir}
git checkout -b %{version} tags/%{version}

%build
cd %{NVdir}
mkdir build
cd build

# Only el7/rhel7 requires carta-gsl and devtoolset
%if 0%{?rhel} == 7
source /opt/rh/devtoolset-8/enable
%cmake .. -DUSE_THREADS=ON \
                 -DUSE_FFTW3=ON \
                 -DUSE_HDF5=ON \
                 -DUSE_THREADS=ON \
                 -DBUILD_PYTHON=OFF \
                 -DBUILD_PYTHON3=OFF \
                 -DBUILD_TESTING=OFF \
                 -DCMAKE_BUILD_TYPE=Release \
                 -DUSE_OPENMP=ON \
                 -DUseCcache=1 \
                 -DHAS_CXX11=1 \
                 -DCMAKE_INSTALL_PREFIX=/opt/carta-casacore \
                 -DDATA_DIR=/usr/share/casacore/data \
                 -DENABLE_RPATH=NO \
                 -DGSL_CONFIG=/opt/carta-gsl/bin/gsl-config \
                 -DCMAKE_CXX_FLAGS="-I/opt/carta-gsl/include" \
                 -DGSL_INCLUDE_DIR=/opt/carta-gsl/include \
                 -DGSL_CBLAS_LIBRARY=/opt/carta-gsl/lib \
                 -DGSL_LIBRARY=/opt/carta-gsl/lib \
                 -DGSL_CONFIG=/opt/carta-gsl/bin/gsl-config \
                 -DCMAKE_CXX_FLAGS="-I/opt/carta-gsl/include" \
                 -DCMAKE_CXX_STANDARD_LIBRARIES="-L/opt/carta-gsl/lib"
%make_build
%install
cd %{NVdir}/build
%make_install
%endif

%if 0%{?rhel} == 8 || 0%{?rhel} == 9
%cmake .. -DUSE_THREADS=ON \
          -DUSE_FFTW3=ON \
          -DUSE_HDF5=ON \
          -DBUILD_PYTHON=OFF \
          -DBUILD_PYTHON3=OFF \
          -DBUILD_TESTING=OFF \
          -DUSE_OPENMP=ON \
          -DUseCcache=1 \
          -DHAS_CXX11=1 \
          -DCMAKE_INSTALL_PREFIX=/opt/carta-casacore \
          -DDATA_DIR=/usr/share/casacore/data \
          -DENABLE_RPATH=NO
%cmake_build
%install
cd %{NVdir}/build
%cmake_install
%endif

%if 0%{?suse_version} >= 1500
export CC=gcc CXX=g++-9 FC=gfortran-9
cmake .. -DUSE_THREADS=ON \
          -DUSE_FFTW3=ON \
          -DUSE_HDF5=ON \
          -DBUILD_PYTHON=OFF \
          -DBUILD_PYTHON3=OFF \
          -DBUILD_TESTING=OFF \
          -DUSE_OPENMP=ON \
          -DUseCcache=1 \
          -DHAS_CXX11=1 \
          -DCMAKE_INSTALL_PREFIX=/opt/carta-casacore \
          -DDATA_DIR=/usr/share/casacore/data \
          -DENABLE_RPATH=NO
make -j 2
%install
cd %{NVdir}/build
%make_install
%endif


mkdir -p %{buildroot}%{_sysconfdir}/ld.so.conf.d
/bin/echo "/opt/carta-casacore/lib" > %{buildroot}%{_sysconfdir}/ld.so.conf.d/%{name}.conf

%if 0%{?rhel} == 7
/bin/echo "/opt/carta-gsl/lib" >> %{buildroot}%{_sysconfdir}/ld.so.conf.d/%{name}.conf
%endif

%clean
rm -rf $RPM_BUILD_ROOT

%post
%{__ln_s} -f /opt/carta-casacore/bin/casa_data_autoupdate %{_bindir}
/sbin/ldconfig

%postun
%{__rm} -f /usr/bin/casa_data_autoupdate
/sbin/ldconfig

%files devel
/opt/carta-casacore/include/*
/opt/carta-casacore/lib/*
/opt/carta-casacore/bin/casa_data_autoupdate
%exclude /opt/carta-casacore/bin/casahdf5support
%exclude /opt/carta-casacore/bin/findmeastable
%exclude /opt/carta-casacore/bin/fits2table
%exclude /opt/carta-casacore/bin/image2fits
%exclude /opt/carta-casacore/bin/imagecalc
%exclude /opt/carta-casacore/bin/imageregrid
%exclude /opt/carta-casacore/bin/imageslice
%exclude /opt/carta-casacore/bin/lsmf
%exclude /opt/carta-casacore/bin/measuresdata
%exclude /opt/carta-casacore/bin/measuresdata-update
%exclude /opt/carta-casacore/bin/ms2uvfits
%exclude /opt/carta-casacore/bin/msselect
%exclude /opt/carta-casacore/bin/readms
%exclude /opt/carta-casacore/bin/showtableinfo
%exclude /opt/carta-casacore/bin/showtablelock
%exclude /opt/carta-casacore/bin/tablefromascii
%exclude /opt/carta-casacore/bin/taql
%exclude /opt/carta-casacore/bin/tomf
%exclude /opt/carta-casacore/bin/writems
%config(noreplace) %_sysconfdir/ld.so.conf.d/%{name}.conf

%files
/opt/carta-casacore/lib/libcasa_imageanalysis.so.3
/opt/carta-casacore/lib/libcasa_measures.so.6
/opt/carta-casacore/lib/libcasa_scimath.so.6
/opt/carta-casacore/lib/libcasa_tables.so.6
/opt/carta-casacore/lib/libcasa_mirlib.so.6
/opt/carta-casacore/lib/libcasa_casa.so.6
/opt/carta-casacore/lib/libcasa_images.so.6
/opt/carta-casacore/lib/libcasa_lattices.so.6
/opt/carta-casacore/lib/libcasa_coordinates.so.6
/opt/carta-casacore/lib/libcasa_fits.so.6
/opt/carta-casacore/lib/libcasa_scimath_f.so.6
/opt/carta-casacore/bin/casa_data_autoupdate

%config(noreplace) %_sysconfdir/ld.so.conf.d/%{name}.conf

%changelog
* Wed Jul 26 2023 William Davey <wdavey@pawsey.org.au> 3.4.0+6.5.0+2022.5.11-5
- Pulls source directly from scm

* Thu Mar 2 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.4.0+6.5.0+2022.5.11-4
- spec file modified to work with rhel 7/8/9

* Mon Feb 6 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.4.0+6.5.0+2022.5.11-3
- spec file modified to work with opensuse 15.4

* Sun Aug 21 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.4.0+6.5.0+2022.5.11-2
- spec file modified to work on el7, el8, and el9

* Wed May 11 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.4.0+6.5.0+2022.5.11
- update to the casa_data_autoupdate script (Github commit e21f813)

* Fri Apr 22 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.4.0+6.5.0+2022.4.22
- updating the carta-casacore version with casa_data_autoupdate script (Github commit 6f8b326) 

* Tue Apr 12 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.4.0+6.5.0+2022.4.12
- updating the carta-casacore version (Github commit c5ec4ab)

* Mon Apr 4 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw>3.4.0+6.4.4+2022.3.9-2
- Rebuild for aarch64 plus to use carta-gsl 2.5 because carta_backend 3.0 
  onward requires a newer gsl than el7's default gsl 1.15 

* Thu Mar 10 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.4.0+6.4.4+2022.3.9
- updating the carta-casacore version

* Thu Apr 29 2021 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.4.0+5.8.0+2021.4.24
- carta-casacore RPM with new install path of /opt/carta-casacore
