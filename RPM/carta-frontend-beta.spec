#
# This experimental beta version installs the beta carta-frontend
# into the /opt/carta-backend-beta directory so that the beta 
# and normal release versions can be kept on the same system
# 
%define my_prefix  %{_prefix}
%define debug_package %{nil}
%undefine _disable_source_fetch
%define beta_install_path /opt/carta-beta

Name:           carta-frontend-beta
Version:        4.0+2023.5.4
Release:        1
Summary:        carta-frontend-beta as needed by carta-beta

License:        GPL-3+
URL:            https://github.com/CARTAvis/carta-frontend
Source0:        carta-frontend-beta-4.0+2023.5.4.tgz

%description
A production built carta-frontend component simply extracted from an npm package.
Requires a carta-backend-beta.

%prep
%setup -q

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{beta_install_path}/share/carta/frontend
cp -r build/* %{buildroot}%{beta_install_path}/share/carta/frontend

%clean
rm -rf %{buildroot}

%files
%{beta_install_path}/share/carta/frontend

%changelog
* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - Custom carta-frontend-beta component for the CARTA 4.0-beta.1 release
