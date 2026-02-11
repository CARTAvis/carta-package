Name:           carta-beta
Version:        5.1+2026.1.16
Release:        1
Summary:        CARTA - Cube Analysis and Rendering Tool for Astronomy
License:        GPL-3.0-only
URL:            https://github.com/CARTAvis/carta-backend

BuildArch: %{_arch}

Requires: carta-backend-beta
Requires: carta-frontend-beta

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
* Fri Jan 16 2026 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.1+2026.1.16
  - carta-beta metapackage for the CARTA 5.1-beta.2026.1.16 release

* Thu Jul 31 2025 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.0+2025.7.31
  - carta-beta metapackage for the CARTA 5.0-beta.2025.7.31 release

* Tue Jul 22 2025 Po-Sheng Huang <posheng@asiaa.sinica.edu.tw> 5.0+2025.7.22
  - carta-beta metapackage for the CARTA 5.0-beta.2025.7.22 release

* Fri Feb 14 2025 Cheng-Chin Chiang <chcchiang@asiaa.sinica.edu.tw> 5.0+2025.2.14
  - carta-beta metapackage for the CARTA 5.0-beta.1 release

* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - carta-beta metapackage for the CARTA 4.0-beta.1 release
