%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build

Name:           carta-cfitsio-v450
Version:        4.5.0
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
BuildRequires: curl-devel
BuildRequires: bzip2-devel

%description
CFITSIO is a C library for reading and writing data files in the Flexible Image
Transport System (FITS) format. It provides an efficient, self-documenting interface 
to FITS files and is widely used in astronomy and related fields.

%package devel
Summary: Development files for carta-cfitsio-v450
Provides: carta-cfitsio-v450-devel

%description devel
Development package of carta-cfitsio-v450 containing the lib and header files.

%define NVdir %{name}-%{version}

%prep
rm -rf %{NVdir}
git clone %{url} %{NVdir}
cd %{NVdir}
git checkout -b %{version} tags/cfitsio-%{version}

%build
cd %{NVdir}
./configure --prefix=%{_prefix} --libdir=%{_libdir} --includedir=%{_includedir}/cfitsio
make

%install
cd %{NVdir}
%make_install

%clean
rm -rf $RPM_BUILD_ROOT

%files devel
%{_includedir}/cfitsio/*.h
%{_libdir}/libcfitsio.*
%{_libdir}/pkgconfig/cfitsio.pc
%{_bindir}/*

%files
%{_libdir}/libcfitsio.*
%{_libdir}/pkgconfig/cfitsio.pc
%{_bindir}/*

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

%changelog
* Thu Feb 22 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 4.5.0-1
  - Build cfitsio 4.5.0 from source codes
