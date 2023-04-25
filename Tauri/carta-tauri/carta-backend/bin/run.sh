#!/bin/bash

dirname=`dirname $0`

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )/../etc"

export CASAPATH="../../../../../$DIR linux"

if [ "$(uname)" == "Linux" ]; then
   export LD_LIBRARY_PATH=$dirname/../lib:$LD_LIBRARY_PATH
fi

$dirname/casa_data_autoupdate
$dirname/carta_backend @$ --frontend_folder=$dirname/../../carta-frontend --no_browser
