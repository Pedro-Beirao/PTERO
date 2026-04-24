###########################################################
# DOCKERFILE - DINASORE
#
# This Dockerfile contains Dinasore's base image for SINF.
#
# Author:
#   Luís Vilaça [luis.vilaca@fe.up.pt]
###########################################################

FROM python:3.8

# -------------------------------------
# Add Dinasore

# Move to base location
WORKDIR /sinf

# Clone from github
RUN git clone https://github.com/Pedro-Beirao/dinasore.git

WORKDIR /sinf/dinasore

# Install Python requirements
RUN pip install -r requirements.txt
RUN pip install numpy scipy argparse psycopg2 asyncua

# -------------------------------------
# Add Custom Function Blocks

WORKDIR /sinf/dinasore/resources/function_blocks

# All Custom FB blocks should be placed under "project/SINF_0/FBs/SINF"
ADD ../data/fb/* .

# -------------------------------------
# Docker entrypoint
WORKDIR /sinf
COPY --chmod=0700 dinasore/docker-entrypoint.sh .

# Ports: no need to expose because we are using the host's NIC
#   4DIAC-IDE: 61499
#   OPC-UA: 4840
ENTRYPOINT [ "/sinf/docker-entrypoint.sh" ]
