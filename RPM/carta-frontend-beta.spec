#
# This experimental beta version installs the beta carta-frontend
# into the /opt/carta-backend-beta directory so that the beta 
# and normal release versions can be kept on the same system
# 
%define my_prefix  %{_prefix}
%define debug_package %{nil}
%undefine _disable_source_fetch

%define beta_install_path /opt/carta-beta
%define frontend_version 5.0.0-beta.1c
%define version_date 2025.2.14

Name:           carta-frontend-beta
Version:        5.0+${version_date}
Release:        1
Summary:        carta-frontend-beta as needed by carta-beta

License:        GPL-3+
URL:            https://github.com/CARTAvis/carta-frontend
Source0:        https://registry.npmjs.org/carta-frontend/-/carta-frontend-${frontend_version}.tgz

BuildArch: noarch

%description
A production built carta-frontend component simply extracted from an npm package.
Requires a carta-backend-beta.

%prep
# %setup -q
tar -xzf %{_sourcedir}/carta-frontend-${frontend_version}.tgz
rm -rf carta-frontend-beta-%{version}
mv package carta-frontend-beta-%{version}
cd carta-frontend-beta-%{version}

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{beta_install_path}/share/carta/frontend
cp -r carta-frontend-beta-%{version}/build/* %{buildroot}%{beta_install_path}/share/carta/frontend

%clean
rm -rf %{buildroot}

%files
%{beta_install_path}/share/carta/frontend

%changelog
* Thu Feb 14 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 5.0+2025.2.14
  - Custom carta-frontend-beta component for the CARTA 5.0-beta.1 release
  
* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - Custom carta-frontend-beta component for the CARTA 4.0-beta.1 release
