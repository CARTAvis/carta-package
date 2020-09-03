#!/bin/bash

## Use CARTA desktop without Electron

DIRNAME=`dirname $0`

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

########################################################################
### There may be multiple users on the same server, so get unused ports
read LOWERPORT UPPERPORT < /proc/sys/net/ipv4/ip_local_port_range
while :
do
        FRONTEND_PORT="`shuf -i $LOWERPORT-$UPPERPORT -n 1`"
        WEBSOCKET_PORT="`shuf -i $LOWERPORT-$UPPERPORT -n 1`"
        ss -lpn | grep -q ":$FRONTEND_PORT" || break
        ss -lpn | grep -q ":$WEBSOCKET_PORT" || break
done
#######################################################################

#######################################################################
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
######################################################################

#######################################################################
### Find the host IP address or server name
SERVER_NAME=$(hostname)
SERVER_IP=$(hostname -I | cut -d' ' -f1)
######################################################################

## Find the number of threads on the system
NTHREADS=$(getconf _NPROCESSORS_CONF)

#####################################################################
##### Default values
folder=$PWD
root=/
threads=4
omp_threads=$NTHREADS
port=$WEBSOCKET_PORT
fport=$FRONTEND_PORT
grpc_port=-1

#####################################################################
display_help () {
 echo "usage: carta [] CARTA file browser will default to the current path."
 echo "             [<path>] CARTA file browser will default to the specified"
 echo "                      path <path> e.g. carta ~/CARTA/Images"
 echo "             [<image>] CARTA will directly open the image named <image>"
 echo "                       e.g. carta aJ.fits or carta ~/CARTA/Images/aJ.fits"
 echo "             [--folder=<path>] Optional: An alternative way to define the"
 echo "                               default CARTA file browser path."
 echo "                               Note: Not for directly opening an image."
 echo "             [--help] View this help output"
 echo "Remote mode flags"
 echo "             [--remote] start CARTA in 'remote' mode. For accessing CARTA's"
 echo "                        frontend through your webrowser rather than the standard"
 echo "                        Electron interface. A free websocket port and a frontend"
 echo "                        port will be chosen automatically."
 echo "             [--port=<number>] Optional: Manually choose a websocket port for the"
 echo "                               backend. CARTA will check if the port is available"
 echo "                               and issue a warning if not. A typical value is"
 echo "                               between 1025-65535."
 echo "             [--fport=<number>] Optional: Manually choose a frontend port for the"
 echo "                                CARTA web interface. CARTA will check if the port"
 echo "                                is available and issue a warning if not. A typical"
 echo "                                value is between 1025-65535."
 echo "             [--grpc_port=<number>] Optional: Manually choose a port to activate "
 echo "                                    and use the scripting functionality."
 echo "                                    Note: This feature is currently in development."
 echo "Advanced usage flags"
 echo "             [--root=<path>] Define the lowest path the file browser can"
 echo "                             navigate to. e.g. carta --root /home/bob means the"
 echo "                             the file browser can not access anything in /home"
 echo "                             Note: --root can not be set inside --folder."
 echo "             [--threads=<number>] Set number of threads. It controls how many"
 echo "                                  threads CPU-intensive tasks are split across."
 echo "                                  The default value is 4."
 echo "             [--omp_threads=<number>] Set the number of OpenMP threads. It controls"
 echo "                                      how trivially parallelisable tasks are split"
 echo "                                      by CARTA. The default value is the"
 echo "                                      automatically detected number of cores on"
 echo "                                      you system; usually 4 or 8 on a typical"
 echo "                                      desktop or laptop."
 echo "             [--size=<width>x<height>] Manually define the dimensions of CARTA's"
 echo "                                       Electron window in pixels."
 echo "             [--disable-gpu] May help if running CARTA Desktop through a VNC server"
 echo "                             and images are not rendering properly."
 echo "             [--debug] Open the DevTools in the Electron window."

}
#####################################################################

## Get command line variables
for i in "$@"
do
case $i in
    -folder=*|--folder=*)
    folder="${i#*=}"
    shift # past argument=value
    ;;
    -root=*|--root=*)
    root="${i#*=}"
    shift # past argument=value
    ;;
    -threads=*|--threads=*)
    threads="${i#*=}"
    shift # past argument=value
    ;;
    -omp_threads=*|--omp_threads=*)
    omp_threads="${i#*=}"
    shift # past argument=value
    ;;
    -port=*|--port=*)
    port="${i#*=}"
    shift # past argument=value
    ;;
    -fport=*|--fport=*)
    fport="${i#*=}"
    shift # past argument=value
    ;;
    -grpc_port=*|--grpc_port=*)
    grpc_port="${i#*=}"
    shift # past argument=value
    ;;
    --help)
    display_help
    exit 1
    shift # past argument with no value
    ;;
    *)
          # unknown option
    ;;
esac
done
#################################################################
#echo "DEBUG: folder= ${folder}"
#echo "DEBUG: root= ${root}"
#echo "DEBUG: threads= ${threads}"
#echo "DEBUG: port= ${port}"
#echo "DEBUG: fport= ${fport}"
#echo "DEBUG: omp_threads= ${omp_threads}"
#echo "DEBUG: grpc_port= ${grpc_port}"

#################################################################
#### Do some checks on the user defined command line variables

if [ ! -d "$folder" ]; then
 echo "$folder path does not exist. Defaulting to $HOME" 
 exit 1
fi
if [ ! -d "$root" ]; then
 echo "$root path does not exist. Please check." 
 exit 1
fi
if [[ $threads != [0-9]* ]]; then
 echo "Chosen thread value is not a number. Please check." 
 exit 1
fi
if [[ $omp_threads != [0-9]* ]]; then
 echo "Chosen omp_thread value is not a number. Please check." 
 exit 1
fi
if [[ $port != [0-9]* ]] ; then
 echo "Requested websocket port is not a number. Please check." 
 exit 1
fi
if [[ $fport != [0-9]* ]]; then
 echo "Requested frontend port is not a number. Please check." 
 exit 1
fi
if [[ $grpc_port != -1 && $fport != [0-9]* ]]; then
 echo "Requested gRPC port is not a number. Please check."
 exit 1
fi
if [[ $port -lt 1025 || $port -gt 65535 ]] ; then
 echo "Requested websocket port is out of range. Please check." 
 exit 1
fi
if [[ $fport -lt 1025 || $fport -gt 65535 ]]; then
 echo "Requested frontend port is out of range. Please check." 
 exit 1
fi
if [[ $grpc_port != -1 && $grpc_port -lt 1025 || $grpc_port -gt 65535 ]]; then
 echo "Requested gRPC port is out of range. Please check." 
 exit 1
fi
checkport=`lsof -i :$port`
if [ "$checkport" != "" ]; then
    echo "Chosen websocket port is in use. Please chose another"
    exit 1
fi
checkfport=`lsof -i :$fport`
if [ "$checkfport" != "" ]; then
    echo "Chosen frontend port is in use. Please chose another."
    exit 1
fi

#######################################################################
### Start the python http server
cd $DIR/resources/app

# Latest ubuntu versions come with python3 by default
# The python simple http server command is different for python3
# Check if python3 is installed or not and run the appropriate command

if command -v python3 &>/dev/null; then
#    echo "DEBUG: python3 present"
    python3 -m http.server $fport > /dev/null 2>&1 &
else
#    echo "DEBUG: python2 present"
    python -m SimpleHTTPServer $fport > /dev/null 2>&1 &
fi
#######################################################################

#######################################################################
### Start the carta_backend process

## Source the measures data
DIR="$( cd "$( pwd "${BASH_SOURCE[0]}" )" >/dev/null && pwd )/carta-backend/etc"

export CASAPATH="../../../../$DIR linux"

export LD_LIBRARY_PATH=$DIR/../lib:$LD_LIBRARY_PATH

$DIR/../bin/carta_backend verbose=true base=$folder root=$root port=$port threads=$threads omp_threads=$omp_threads grpc_port=$grpc_port >> $logfilename 2>&1 &
# Get this carta_backend process PID
this_carta_pid=$!

sleep 1

echo "Starting CARTA in remote mode"
echo " "
echo "To access CARTA, please enter either of the following URLs in your local web browser: "
echo " "
echo "$SERVER_NAME:$fport/?socketUrl=ws://$SERVER_NAME:$port"
echo " "
echo "OR"
echo " "
echo "$SERVER_IP:$fport/?socketUrl=ws://$SERVER_IP:$port"
echo " "
echo " "
if [[ $grpc_port != -1 ]]; then
echo "Your gRPC port number is $grpc_port"
fi
echo " "
echo " "

######################################################################
### Get the PIDs of the HTTP server

if command -v python3 &>/dev/null; then
  httpserver_pid=$(ps aux | grep ${USER:0:5} | grep '[p]ython3 -m http.server' | awk '{print $2}')
else
  httpserver_pid=$(ps aux | grep ${USER:0:5} | grep '[p]ython -m SimpleHTTPServer' | awk '{print $2}')
fi

### Wait for the user to enter 'q' before exiting
while true; do
    echo -en "Press q to close CARTA:"
    read input
    if [[ $input = "q" ]] || [[ $input = "Q" ]]
        then break
    else
       echo "" 
    fi
done

### Stop the remote carta_backend process
kill $this_carta_pid

### Check if there are any other carta_pids active from the user (excluding Electron desktop carta_pid)
all_carta_pid=$(ps aux | grep $USER | grep '[c]arta_backend' | grep -v 54140 | awk '{print $2}' | wc -w)

### Only stop all HTTP servers if there are no other remote carta_processes running
### (This allows for multiple remote processes to be run)
if [ $all_carta_pid -eq 0 ]; then
       kill $httpserver_pid
fi

### Go back to original directory
cd -
