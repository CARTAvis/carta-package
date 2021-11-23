#!/bin/bash

dirname=`dirname $0`

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )/../etc"

export CASAPATH="../../../../$DIR linux"

if [ "$(uname)" == "Linux" ]; then
   export LD_LIBRARY_PATH=$dirname/../lib:$LD_LIBRARY_PATH
fi

#echo "uuid: "$1
#echo "base: "$2
#echo "port: "$3

CARTA_AUTH_TOKEN=$1 $dirname/carta_backend $2 --port=$3 --frontend_folder=$dirname/../../ --no_browser
