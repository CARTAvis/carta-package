%define debug_package %{nil}
%undefine _disable_source_fetch

Name:           measures-data
Version:        2025.2.13
Release:        1%{?dist}
Summary:        CASA ephemerides and geodetic data
License:        GPL-3+
URL:            ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar
Source0:        ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar

%description
CASA ephemerides and geodetic data needed by CARTA downloaded from ftp.astron.nl.

%prep
%setup -c %{name}-%{version}

%build

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/usr/share/casacore/data
cp -r ephemerides $RPM_BUILD_ROOT/usr/share/casacore/data/
cp -r geodetic $RPM_BUILD_ROOT/usr/share/casacore/data/

%clean
rm -rf $RPM_BUILD_ROOT

%files
/usr/share/casacore/data/ephemerides/
/usr/share/casacore/data/geodetic/

%changelog
* Mon Feb 17 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 2025.2.17
- Download latest geodeditc and ephemerides direct from ftp.astron.nl

* Sat Jan 20 2024 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 2024.1.20
- Download latest geodeditc and ephemerides direct from ftp.astron.nl

* Sun Aug 21 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 2022.8.21
- Download latest geodeditc and ephemerides direct from ftp.astron.nl

* Sat Aug 20 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 2022.8.20
- Using /usr/share instead of /usr/local/share

* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 2022.8.18
- Updated CASA measures data.

* Mon Apr 5 2021 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 2021.4.5
- Initial CASA measures data. Using a prepacked version. Will try using svn next.
