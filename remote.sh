#!/bin/bash

dirname=`dirname $0`

## Check if log directory exists and if not, create it.
if [ ! -d $HOME/CARTA/log ]; then
        mkdir -p $HOME/CARTA/log
        touch $HOME/CARTA/log/carta.log
fi
logfilename=$HOME/CARTA/log/$(date +"%Y%m%d_%H%M%S_%Z").log

## Keep only the latest 5 log files
if [ "$(uname)" == "Linux" ]; then
   ls -C1 -t ~/CARTA/log/* | awk 'NR>5' | xargs --no-run-if-empty rm
fi
if [ "$(uname)" == "Darwin" ]; then
   ls -C1 -t ~/CARTA/log/* | awk 'NR>5' | xargs rm
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )/../etc"

export CASAPATH="../../../../$DIR linux"

if [ "$(uname)" == "Linux" ]; then
   export LD_LIBRARY_PATH=$dirname/../lib:$LD_LIBRARY_PATH
fi

### Find the host IP address or server name
SERVER_NAME=$(hostname)

if [ "$(uname)" == "Darwin" ]; then
        SERVER_IP=$(ipconfig getifaddr en0)
fi
if [ "$(uname)" == "Linux" ]; then
        SERVER_IP=$(hostname -I | cut -d' ' -f1)
fi

# $1 = base
# $2 = root
# $3 = port
# $4 = threads
# $5 = frontend port
# $6 = websocket port

echo " "
echo "To access CARTA, please enter either of the following URLs in your local web browser: "
echo " "
echo "$SERVER_NAME:$5/?socketUrl=ws://$SERVER_NAME:$3"
echo " "
echo "OR"
echo " "
echo "$SERVER_IP:$5/?socketUrl=ws://$SERVER_IP:$3"
echo " "
echo "Press ctrl+c to exit"
echo " "

$dirname/carta_backend base=$1 root=$2 port=$3 threads=$4 >> $logfilename 2>&1

### Exit script
