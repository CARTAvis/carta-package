Name:           carta
Version:        5.0.0
Release:        1
Summary:        CARTA - Cube Analysis and Rendering Tool for Astronomy
License:        GPL-3.0-only
URL:            https://github.com/CARTAvis/carta-backend

BuildArch: %{_arch}

Obsoletes: carta < 5.0.0
Obsoletes: carta = 5.0.0~rc.0

Requires: carta-backend = 5.0.0
Requires: carta-frontend = 5.0.0

%description
CARTA is a next generation image visualization and analysis tool designed for ALMA, VLA, and SKA pathfinders.
.
This package provides the beta versions of the carta-backend and carta-frontend for testing the latest CARTA features.

%prep

%build

%install

%clean

%files

%changelog
* Thu Jun 12 2025 Kuan-Chou Hou <kchou@asiaa.sinica.edu.tw> 5.0.0
  - CARTA 5.0 release

* Fri Jan 19 2024 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.1.0
  - CARTA 4.1 release

* Tue Sep 5 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0.0
  - CARTA 4.0 release

* Tue Mar 7 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.1-1
  - Backported security fix

* Tue Feb 7 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0-2
  - Rebuilt for opensuse 15.4

* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0
  - CARTA 3.0 release
