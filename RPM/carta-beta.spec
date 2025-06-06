Name:           carta-beta-debug-test
Version:        5.0+2025.2.14
Release:        1
Summary:        CARTA - Cube Analysis and Rendering Tool for Astronomy
License:        GPL-3.0-only
URL:            https://github.com/CARTAvis/carta-backend

BuildArch: %{_arch}

Requires: carta-backend-beta = 5.0+2025.2.14
Requires: carta-frontend-beta = 5.0+2025.2.14

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
* Fri Feb 14 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 5.0+2025.2.14
  - carta-beta metapackage for the CARTA 5.0-beta.1 release

* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - carta-beta metapackage for the CARTA 4.0-beta.1 release
