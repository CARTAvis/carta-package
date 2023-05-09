Name:           carta-beta
Version:        4.0+2023.5.4
Release:        1
Summary:        CARTA - Cube Analysis and Rendering Tool for Astronomy
License:        GPL-3.0-only
URL:            https://github.com/CARTAvis/carta-backend

BuildArch: %{_arch}

Requires: carta-backend-beta = 4.0+2023.5.4
Requires: carta-frontend-beta = 4.0+2023.5.4

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
* Thu May 4 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 4.0+2023.5.4
  - carta-beta metapackage for the CARTA 4.0-beta.1 release
