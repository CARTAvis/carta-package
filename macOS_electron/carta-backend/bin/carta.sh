#!/bin/bash

dirname=`dirname $0`

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )/../etc"

export CASAPATH="../../../../$DIR linux"

$dirname/casa_data_autoupdate

$dirname/carta_backend $@ --frontend_folder=$dirname/../../
