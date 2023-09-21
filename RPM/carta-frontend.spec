%define my_prefix  %{_prefix}
%define debug_package %{nil}
%undefine _disable_source_fetch

Name:           carta-frontend
Version:        4.0.0
Release:        1
Summary:        carta-frontend as needed by carta

License:        GPL-3+
URL:            https://github.com/CARTAvis/carta-frontend
Source0:        carta-frontend-4.0.0.tgz

Obsoletes: carta-frontend <= 3.0.0
Obsoletes: carta-frontend = 4.0.0~rc.0

%description
A production built carta-frontend component simply extracted from an npm package.
Requires a carta-backend.

%prep
%setup -q

%build

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/%{_datadir}/carta/frontend
cp -r build/* $RPM_BUILD_ROOT/%{_datadir}/carta/frontend

%clean
rm -rf $RPM_BUILD_ROOT

%files
%{_datadir}/carta/frontend

%changelog
* Tue Sep 5 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0.0
  - carta-backend component for the CARTA 4.0 release

* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0
- carta-frontend component for the CARTA 3.0 release

