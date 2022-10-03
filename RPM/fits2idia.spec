%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build
%define my_prefix  %{_prefix}

Name:           fits2idia
Version:        0.1.15
Release:        1
Summary:        C++ implementation of FITS to IDIA-HDF5 converter, optimised using OpenMP
License:        GPL-3+
URL:            https://github.com/idia-astro/fits2idia
Source0:        %{name}-%{version}.tgz

BuildArch: %{_arch}

# el7 requires newer gcc from devtoolset
%{?el7:BuildRequires: devtoolset-8-gcc-c++}

BuildRequires: bzip2-devel
%{?el7:BuildRequires: carta-cfitsio-devel}
%{?el7:BuildRequires: carta-cfitsio-static}
%{?el8:BuildRequires: cfitsio-devel}
%{?el8:BuildRequires: cfitsio-static}
%{?el9:BuildRequires: cfitsio-devel}
%{?el9:BuildRequires: cfitsio-static}
BuildRequires: cmake3
BuildRequires: curl-devel
BuildRequires: gcc-c++
BuildRequires: hdf5-devel

Requires:  hdf5
Requires:  libgomp

%define _lib /lib
%define _bin /bin

%description
C++ implementation of FITS to IDIA-HDF5 converter, optimised using OpenMP

%prep
%setup -q

%build
mkdir build
cd build
cmake3 .. -DCMAKE_INSTALL_PREFIX=/usr
make

%install
cd build
%make_install

%clean
rm -rf $RPM_BUILD_ROOT

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

%files
%{_bindir}/fits2idia

%changelog
* Tue Sep 13 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 0.1.15
- fits2idia rebuilt on Copr

