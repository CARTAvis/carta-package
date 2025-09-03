#!/bin/bash

dirname=$(dirname $0)

#echo "uuid: "$1
#echo "base: "$2
#echo "port: "$3
#echo "extra: "${@:4}

CARTA_AUTH_TOKEN=$1 $dirname/squashfs-root/AppRun $2 --host localhost --port=$3 --no_browser ${@:4}
