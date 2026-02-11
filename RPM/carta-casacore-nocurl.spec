%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build
%define my_prefix  %{_prefix}
%define cfitsio_prefix /opt/carta-cfitsio-v450-curl

Name:           carta-casacore-nocurl
Version:        3.5.0+6.6.0+2024.1.18
Release:        2
Summary:        carta-casacore library files as needed by the CARTA image viewer

License:        GPL-3+
URL:            https://github.com/CARTAvis/carta-casacore

BuildArch: %{_arch}

BuildRequires:  bison
BuildRequires:  carta-cfitsio-v450-curl-devel
BuildRequires:  cmake3
BuildRequires:  fftw-devel
BuildRequires:  flex
BuildRequires:  git

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
BuildRequires:  gsl-devel


Requires: measures-data

%define _lib /lib
%define NVdir %{name}-%{version}

%description
The casacore and casacode image analysis library files (carta-casacore).
Required to run the CARTA image viewer (https://cartavis.org).

%package devel
#Requires:
Summary: carta-casacore library and header files for CARTA image viewer development
Provides: carta-casacore-nocurl-devel

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

%cmake3 .. -DUSE_THREADS=ON \
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
          -DENABLE_RPATH=NO \
          -DCFITSIO_ROOT=%{cfitsio_prefix} \
          -DCMAKE_PREFIX_PATH=%{cfitsio_prefix}
%cmake_build
%install
cd %{NVdir}/build
%cmake_install

%if 0%{?suse_version} >= 1500
export CC=gcc CXX=g++-9 FC=gfortran-9
cmake3 .. -DUSE_THREADS=ON \
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
          -DENABLE_RPATH=NO \
          -DCFITSIO_ROOT=%{cfitsio_prefix} \
          -DCMAKE_PREFIX_PATH=%{cfitsio_prefix}
make -j 2
%install
cd %{NVdir}/build
%make_install
%endif


mkdir -p %{buildroot}%{_sysconfdir}/ld.so.conf.d
/bin/echo "/opt/carta-casacore/lib" > %{buildroot}%{_sysconfdir}/ld.so.conf.d/%{name}.conf

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
/opt/carta-casacore/lib/libcasa_imageanalysis.so.6
/opt/carta-casacore/lib/libcasa_measures.so.7
/opt/carta-casacore/lib/libcasa_scimath.so.7
/opt/carta-casacore/lib/libcasa_tables.so.7
/opt/carta-casacore/lib/libcasa_mirlib.so.7
/opt/carta-casacore/lib/libcasa_casa.so.7
/opt/carta-casacore/lib/libcasa_images.so.7
/opt/carta-casacore/lib/libcasa_lattices.so.7
/opt/carta-casacore/lib/libcasa_coordinates.so.7
/opt/carta-casacore/lib/libcasa_fits.so.7
/opt/carta-casacore/lib/libcasa_scimath_f.so.7
/opt/carta-casacore/bin/casa_data_autoupdate

%config(noreplace) %_sysconfdir/ld.so.conf.d/%{name}.conf

%changelog
* Thu Feb 5 2026 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 3.5.0+6.6.0+2024.1.18
- Update measures-data and fix cfitsio-v450 path

* Thu Jul 24 2025 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 3.5.0+6.6.0+2024.1.18
- Update measures-data which downloads the latest geodeditc and ephemerides

* Thu Jun 12 2025 Kuan-Chou Hou <kchou@asiaa.sinica.edu.tw> 3.5.0+6.6.0+2024.1.18
- Remove rhel7 specific requirements

* Thu Feb 14 2025 Kuan-Chou Hou <kchou@asiaa.sinica.edu.tw> 3.5.0+6.6.0+2024.1.18
- No curl version

* Thu Jan 18 2024 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.5.0+6.6.0+2024.1.18
- Updating to casa 6.6.0

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
