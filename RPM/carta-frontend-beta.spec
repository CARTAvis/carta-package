#
# This experimental beta version installs the beta carta-frontend
# into the /opt/carta-backend-beta directory so that the beta 
# and normal release versions can be kept on the same system
# 
%define my_prefix  %{_prefix}
%define debug_package %{nil}
%undefine _disable_source_fetch

Name:           carta-frontend-beta
Version:        4.0+2023.5.4
Release:        1
Summary:        carta-frontend as needed by carta

License:        GPL-3+
URL:            https://github.com/CARTAvis/carta-frontend
Source0:        carta-frontend-beta-4.0+2023.5.4.tgz

%description
A production built carta-frontend component simply extracted from an npm package.
Requires a carta-backend.

%prep
%setup -q

%build

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/opt/carta-backend-beta/share/carta/frontend
cp -r build/* $RPM_BUILD_ROOT/opt/carta-backend-beta/share/carta/frontend

%clean
rm -rf $RPM_BUILD_ROOT

%files
/opt/carta-backend-beta/share/carta/frontend

%changelog
* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - Custom carta-frontend-beta component for the CARTA 4.0-beta.1 release

