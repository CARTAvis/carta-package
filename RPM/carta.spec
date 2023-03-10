Name:           carta
Version:        3.0.1
Release:        1
Summary:        CARTA - Cube Analysis and Rendering Tool for Astronomy
License:        GPL-3.0-only
URL:            https://github.com/CARTAvis/carta-backend

BuildArch: %{_arch}

Requires: carta-backend = 3.0.1
Requires: carta-frontend = 3.0.0

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
* Tue Mar 7 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.1-1
  - Backported security fix

* Tue Feb 7 2023 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0-2
  - Rebuilt for opensuse 15.4

* Thu Aug 18 2022 Anthony Moraghan <ajm@asiaa.sinica.edu.tw> 3.0.0
  - CARTA 3.0 release
