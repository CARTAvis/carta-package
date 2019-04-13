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

echo $1
echo $2
echo $3
echo $4

#exec(path.join(__dirname,'carta-backend/bin/run.sh').concat(' ',cartabase,' ',cartaroot,' ',cartaport,' ',cartathreads));

$dirname/carta_backend verbose=true base=$1 root=$2 port=$3 threads=$4 >> $logfilename 2>&1
