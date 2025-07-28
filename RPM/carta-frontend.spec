# %define my_prefix  %{_prefix}
%define debug_package %{nil}
%undefine _disable_source_fetch

# %define frontend_version 5.0.0-dev
%define frontend_version 5.0.2

Name:           carta-frontend
Version:        5.0.2
Release:        1
Summary:        carta-frontend as needed by carta
License:        GPL-3+
URL:            https://github.com/CARTAvis/carta-frontend
Source0:        https://registry.npmjs.org/carta-frontend/-/carta-frontend-%{frontend_version}.tgz

Obsoletes: carta-frontend <= 5.0.2
Obsoletes: carta-frontend = 5.0.2~rc.0

BuildArch: noarch

%description
A production built carta-frontend component simply extracted from an npm package.
Requires a carta-backend.

%prep
%setup -q -c -T
tar -xzf %{_sourcedir}/carta-frontend-%{frontend_version}.tgz
rm -rf carta-frontend-%{frontend_version}
mv package carta-frontend-%{frontend_version}
cd carta-frontend-%{frontend_version}

%build

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/%{_datadir}/carta/frontend
cp -r carta-frontend-%{frontend_version}/build/* $RPM_BUILD_ROOT/%{_datadir}/carta/frontend

%clean
rm -rf $RPM_BUILD_ROOT

%files
%{_datadir}/carta/frontend

%changelog
* Tue Jul 22 2025 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.0.2
  - carta-frontend component for the CARTA 5.0 release

* Thu Jun 12 2025 Kuan-Chou Hou <kchou@asiaa.sinica.edu.tw> 5.0.0
  - carta-frontend component for the CARTA 5.0 release

* Fri Jan 19 2024 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.1.0
  - carta-frontend component for the CARTA 4.1 release
  - pull the source directly from the npm registry

* Tue Sep 5 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0.0
  - carta-frontend component for the CARTA 4.0 release

* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0
  - carta-frontend component for the CARTA 3.0 release

