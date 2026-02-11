%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build

Name:           carta-cfitsio-v450-curl
Version:        4.5.0
Release:        2%{?dist}
Summary:        Library for reading and writing FITS data files

License:        BSD-3-Clause
URL:            https://github.com/HEASARC/cfitsio.git

BuildRequires: gcc
BuildRequires: make
BuildRequires: automake
BuildRequires: git
BuildRequires: glibc
BuildRequires: pkgconfig
BuildRequires: libpkgconf
BuildRequires: pkgconf
BuildRequires: pkgconf-m4
BuildRequires: pkgconf-pkg-config
BuildRequires: zlib-devel
BuildRequires: bzip2-devel
BuildRequires: libtool
BuildRequires: autoconf
BuildRequires: curl-devel

%description
CFITSIO is a C library for reading and writing data files in the Flexible Image
Transport System (FITS) format. It provides an efficient, self-documenting interface 
to FITS files and is widely used in astronomy and related fields.

%package devel
Summary: Development files for carta-cfitsio-v450-curl
Provides: carta-cfitsio-v450-curl-devel

%description devel
Development package of carta-cfitsio-v450-curl containing the lib and header files.

%define NVdir %{name}-%{version}

%define _prefix /opt/%{name}

%prep
rm -rf %{NVdir}
git clone %{url} %{NVdir}
cd %{NVdir}
git checkout -b %{version} tags/cfitsio-%{version}

%build
cd %{NVdir}
autoreconf -f -i
./configure --prefix=%{_prefix} --libdir=%{_prefix}/lib64
make -j 2

%install
cd %{NVdir}
%make_install
# Ensure pkgconfig directory exists and install .pc file
mkdir -p %{buildroot}%{_prefix}/lib64/pkgconfig
install -m 644 cfitsio.pc %{buildroot}%{_prefix}/lib64/pkgconfig/cfitsio.pc

%clean
rm -rf $RPM_BUILD_ROOT

%files devel
%{_prefix}/include/*.h
%{_prefix}/lib*/libcfitsio.*
%{_prefix}/lib*/pkgconfig/cfitsio.pc
%{_prefix}/bin/*

%files
%{_prefix}/include/*.h
%{_prefix}/lib*/libcfitsio.*
%{_prefix}/lib*/pkgconfig/cfitsio.pc
%{_prefix}/bin/*

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

%changelog
* Fri Feb 6 2026 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 4.5.0-2
  - Fix package name to match installation prefix expectation
  - Build cfitsio 4.5.0 for changing install directory
* Thu Feb 22 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 4.5.0-1
  - Build cfitsio 4.5.0 from source codes


