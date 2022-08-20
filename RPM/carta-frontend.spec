%define my_prefix  %{_prefix}
%define debug_package %{nil}

Name:		carta-frontend
Version:	3.0.0
Release:	1%{?dist}
Summary:	carta-frontend as needed by carta

License:	GPL-3+
URL:		https://github.com/CARTAvis/carta-frontend
Source0:	%{name}-%{version}.tgz

BuildArch: %{_arch}

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
* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0
- carta-frontend component for the CARTA 3.0 release

