FROM python:3.8

# Install openssh
RUN apt-get update && apt-get install -y openssh-server

# Setup ssh
RUN echo 'root:dinasore' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
RUN ssh-keygen -A
RUN mkdir -p /var/run/sshd
EXPOSE 22

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
CMD ["/bin/bash", "-c", "/usr/sbin/sshd -D & /sinf/docker-entrypoint.sh"]
