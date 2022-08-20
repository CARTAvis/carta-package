#!/bin/bash

UPDATE_INTERVAL=7
AUTOUPDATE_ENABLED="false"
CASA_DATA_USER_DIR="$HOME/.carta-casacore/data"
CASARC_FILE="$HOME/.carta-casacore/casarc"
CARTA_CONFIG_FILE="$HOME/.carta/config/preferences.json"

function check_json_settings {
    if [ ! -f "$CARTA_CONFIG_FILE" ]
    then
        return
    fi    
    # False JSON parsing
    # Remove spaces, comma, and quotes, then replace colon with one space to get two columns of key-value pairs
    # Finally filter the key-value pair using awk and print the value (2nd column)
    JSON_AUTO_UPDATE_CASA=$(sed -e 's/[",{}]//g;s/[[:space:]]//g;s/:/ /g' $CARTA_CONFIG_FILE | awk -F" " '$1=="auto_update_casa_data" {print $2}' | tail -n 1)
    if [ "$JSON_AUTO_UPDATE_CASA" == "true" ]
    then
        AUTOUPDATE_ENABLED="true"
    fi
    JSON_AUTO_UPDATE_CASA_DATA_INTERVAL=0
    JSON_AUTO_UPDATE_CASA_DATA_INTERVAL=$(sed -e 's/[",{}]//g;s/[[:space:]]//g;s/:/ /g' $CARTA_CONFIG_FILE | awk -F" " '$1=="auto_update_casa_data_interval" {print $2}' | tail -n 1)
    if [ ! -z "$JSON_AUTO_UPDATE_CASA_DATA_INTERVAL" ]
    then
        if [ $JSON_AUTO_UPDATE_CASA_DATA_INTERVAL -gt 0 ]
        then
            UPDATE_INTERVAL=$JSON_AUTO_UPDATE_CASA_DATA_INTERVAL
        fi
    fi
}

function check_cmd_status {
    STATUS=$?
    if [ $STATUS -ne 0 ]
    then
        echo "Something went wrong. Exiting."
        exit $STATUS
    fi
}

function autoupdate {
    WGET="wget"
    CURL="curl"
    MEASURES_DATA_URL="ftp://ftp.astron.nl/outgoing/Measures/WSRT_Measures.ztar"
    TAR_CMD="tar -xzf /tmp/WSRT_Measures.ztar"
    CLEAN_UP="rm /tmp/WSRT_Measures.ztar"

    if [ -x "$(command -v $WGET)" ];
    then	    
        $WGET $MEASURES_DATA_URL -P /tmp && $TAR_CMD -C $CASA_DATA_USER_DIR && $CLEAN_UP
        check_cmd_status # check if status code is zero and exit if not
    elif [ -x "$(command -v $CURL)" ];
	then
        $CURL $MEASURES_DATA_URL --output /tmp/WSRT_Measures.ztar && $TAR_CMD -C $CASA_DATA_USER_DIR && $CLEAN_UP
        check_cmd_status # check if status code is zero and exit if not
    else
	    echo "ERROR: Please install $WGET or $CURL. Exiting" >&2
        exit 1
    fi

    echo "$(date)" > $CASA_DATA_USER_DIR/last_update
    sleep 0.6 # let the progress bar update end
}

function launch_auto_update {
    # http://mywiki.wooledge.org/BashFAQ/034
    autoupdate &
    local i=0
    local sp='/-\|'
    local n=${#sp}
    printf ' '
    sleep 0.1
    while ! [ -f $CASA_DATA_USER_DIR/last_update ]; do
        printf '\b%s' "${sp:i++%n:1}"
        sleep 0.2
    done
    # done
    printf '\b%s' ''
    printf "Update completed successfully on $(date).\n"
}

function autoupdate_if_needed {
    if [ $AUTOUPDATE_ENABLED == "true" ]
    then
        if [ ! -d $CASA_DATA_USER_DIR ]
        then
            mkdir -p $CASA_DATA_USER_DIR # will make a CASA_DATA_USER_DIR if it doesn't exist
        fi
        if [ ! -f $CASARC_FILE ]
        then
            echo "measures.observatory.directory: ~/.carta-casacore/data/geodetic" > $CASARC_FILE
        fi
        if [ -f $CASA_DATA_USER_DIR/last_update ]
        then
            if [[ $(find "$CASA_DATA_USER_DIR/last_update" -mtime +$UPDATE_INTERVAL -print) ]]
            then
                echo "CASA data has not been updated in more than $UPDATE_INTERVAL days. CARTA will try to update the ephemerides and geodetic data now."
                rm $CASA_DATA_USER_DIR/last_update
                launch_auto_update
            else
                echo "CASA data has been updated in the last $UPDATE_INTERVAL days. CARTA will not update the ephemerides and geodetic data."
                exit 0
            fi
        else
            echo "CASA data has not been updated. CARTA will attempt to update automatically."
            launch_auto_update
        fi
    else
        echo "CARTA will use the default ephemerides and geodetic data."
        exit 0
    fi
}

# Logic starts here
# Check JSON for preferences.json settings
check_json_settings
# Launch auto update
autoupdate_if_needed
