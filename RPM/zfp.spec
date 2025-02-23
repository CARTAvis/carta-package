%undefine __cmake_in_source_build
%undefine __cmake3_in_source_build

Name:           zfp
Version:        0.5.5
Release:        4%{?dist}
Summary:        Compressed numerical arrays that support high-speed random access

License:        BSD-3-Clause
URL:            https://github.com/LLNL/zfp.git
Source0:        https://github.com/LLNL/zfp/releases/download/0.5.5/zfp-0.5.5.tar.gz

BuildRequires:  cmake3
BuildRequires:  gcc-c++
BuildRequires:  git

Requires:  libgomp

%description
ZFP 0.5.5 needed by the carta-backend.

%package devel
Summary: ZFP 0.5.5 development files
Provides: zfp-devel

%define NVdir %{name}-%{version}

%description devel
Development package of ZFP 0.5.5 containing the lib and header files.

%prep
rm -rf %{NVdir}
git clone %{url} %{NVdir}
cd %{NVdir}
git checkout -b %{version} tags/%{version}

%build
cd %{NVdir}

%cmake3 -DCMAKE_INSTALL_PREFIX=/usr 
%cmake3_build

%install
cd %{NVdir}
%cmake3_install

%clean
rm -rf $RPM_BUILD_ROOT

%files devel
%{_includedir}/zfp*
%{_includedir}/bitstream.h
%{_libdir}/cmake/zfp
%{_libdir}/lib*

%files
%{_libdir}/libzfp.so
%{_libdir}/libzfp.so.0
%{_libdir}/libzfp.so.0.5.5

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

%changelog
* Wed Feb 19 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 0.5.5-4
  - Remove the build for CentOS 7 and openSUSE

* Wed Jul 26 2023 William Davey <wdavey@pawsey.org.au> 0.5.5-3
  - Pulls source directly from scm

* Tue Feb 7 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 0.5.5-2
  - Rebuilt for opensuse 15.4

* Sat Aug 13 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 0.5.5
  - Rebuilt for RedHat9 (el9)

* Thu Apr 29 2021 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 0.5.5
  - An initial zfp RPM to be used with carta_backend
