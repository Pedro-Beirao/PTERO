#!/usr/bin/bash
set -e

# Arguments:
# -B: avoid the creation of cache folders (conflicts with the FBs folders)
# -a: sets the IP address, default localhost;
# -p: sets the port for 4DIAC-IDE communication, default 61499;
# -l: sets the logging level, which could be ERROR, WARN or INFO, default ERROR;

DIAC_PORT="61499"
HOSTNAME="0.0.0.0"
LOG_LEVEL="INFO"

python3 -B dinasore/core/main.py \
    -a $HOSTNAME \
    -p $DIAC_PORT \
    -l $LOG_LEVEL
