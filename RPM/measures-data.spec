Name:           measures-data
Version:        2022.8.18
Release:        1%{?dist}
Summary:        CASA ephemerides and geodetic data 

License:        GPL-3+
URL:            ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar
Source0:        %{name}-%{version}.tgz

BuildArch: %{_arch}

%description
CASA ephemerides and geodetic data needed by CARTA.

%prep
%setup -q

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
* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 2022.8.18
- Updated CASA measures data.

* Mon Apr 5 2021 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 2021.4.5
- Initial CASA measures data. Using a prepacked version. Will try using svn next.

