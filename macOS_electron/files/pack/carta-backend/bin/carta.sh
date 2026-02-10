#!/bin/bash

dirname=`dirname $0`

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )/../etc"

export CASAPATH="$DIR linux"

if [[ ! " $@ " =~ ( --version | -v | --help | -h ) ]]; then
    if [ -x "$dirname/casa_data_autoupdate" ]; then
        $dirname/casa_data_autoupdate
    fi
fi

$dirname/carta_backend $@ --frontend_folder=$dirname/../../
