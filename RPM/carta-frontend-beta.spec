#
# This experimental beta version installs the beta carta-frontend
# into the /opt/carta-6.0.0~beta.1 directory so that the beta 
# and normal release versions can be kept on the same system
# 
%define my_prefix  %{_prefix}
%define debug_package %{nil}
%undefine _disable_source_fetch

%define beta_install_path /opt/carta-6.0.0~beta.1
%define npm_frontend_version 6.0.0-beta.1.0.2
%define version_date 2026.3.9

Name:           carta-frontend
Version:        6.0.0~beta.1.0.2
Release:        1
Summary:        carta-frontend-6.0.0~beta.1.0.2 as needed by carta-6.0.0~beta.1

License:        GPL-3+
URL:            https://github.com/CARTAvis/carta-frontend
Source0:        https://registry.npmjs.org/carta-frontend/-/carta-frontend-%{npm_frontend_version}.tgz

BuildArch: noarch

%description
A production built carta-frontend component simply extracted from an npm package.
Requires a carta-backend-6.0.0~beta-1.

%prep
# %setup -q
tar -xzf %{_sourcedir}/carta-frontend-%{npm_frontend_version}.tgz
rm -rf carta-frontend-%{version}
mv package carta-frontend-%{version}
cd carta-frontend-%{version}

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{beta_install_path}/share/carta/frontend
cp -r carta-frontend-%{version}/build/* %{buildroot}%{beta_install_path}/share/carta/frontend

%clean
rm -rf %{buildroot}

%files
%{beta_install_path}/share/carta/frontend

%changelog
* Mon Mar 9 2026 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 6.0+2026.3.9
  - Custom carta-frontend-beta component for the CARTA 6.0-beta.2026.3.9 release

* Sat Mar 7 2026 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 6.0+2026.3.7
  - Custom carta-frontend-beta component for the CARTA 6.0-beta.2026.3.7 release

* Tue Mar 3 2026 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 6.0+2026.3.3
  - Custom carta-frontend-beta component for the CARTA 6.0-beta.2026.3.3 release

* Fri Jan 16 2026 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.1+2026.1.16
  - Custom carta-frontend-beta component for the CARTA 5.1-beta.2026.1.16 release

* Thu Jul 31 2025 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.0+2025.7.31
  - Custom carta-frontend-beta component for the CARTA 5.0-beta.2025.7.31 release

* Tue Jul 22 2025 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.0+2025.7.22
  - Custom carta-frontend-beta component for the CARTA 5.0-beta.2025.7.22 release

* Thu Feb 14 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 5.0+2025.2.14
  - Custom carta-frontend-beta component for the CARTA 5.0-beta.1 release
  
* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - Custom carta-frontend-beta component for the CARTA 4.0-beta.1 release
