%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build

Name:           carta-cfitsio-v463-curl
Version:        4.6.3
Release:        1%{?dist}
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
BuildRequires: libcurl-devel

%description
CFITSIO is a C library for reading and writing data files in the Flexible Image
Transport System (FITS) format. It provides an efficient, self-documenting interface 
to FITS files and is widely used in astronomy and related fields.

%package devel
Summary: Development files for carta-cfitsio-v463-curl
Provides: carta-cfitsio-v463-curl-devel

%description devel
Development package of carta-cfitsio-v463 containing the lib and header files.

%define NVdir %{name}-%{version}

%define _prefix /opt/cfitsio

%prep
rm -rf %{NVdir}
git clone %{url} %{NVdir}
cd %{NVdir}
git checkout -b %{version} tags/cfitsio-%{version}

%build
cd %{NVdir}
autoreconf -f -i
./configure --prefix=%{_prefix} --libdir=%{_libdir} --includedir=%{_includedir}
make -j 2

%install
cd %{NVdir}
%make_install

%clean
rm -rf $RPM_BUILD_ROOT

%files devel
%{_includedir}/*.h
%{_libdir}/libcfitsio.*
%{_libdir}/pkgconfig/cfitsio.pc
%{_bindir}/*

%files
%{_includedir}/*.h
%{_libdir}/libcfitsio.*
%{_libdir}/pkgconfig/cfitsio.pc
%{_bindir}/*

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

%changelog
* Fri Jan 16 2026 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 4.6.3-1
  - Build cfitsio 4.6.3 from source codes

* Thu Feb 22 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 4.5.0-1
  - Build cfitsio 4.5.0 from source codes
