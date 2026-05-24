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
WORKDIR /root

# Clone from github
RUN git clone https://github.com/Pedro-Beirao/dinasore.git

WORKDIR /root/dinasore

# Install Python requirements
RUN pip install -r requirements.txt
RUN pip install numpy scipy argparse psycopg2 asyncua

# -------------------------------------
# Add Custom Function Blocks

WORKDIR /root/dinasore/resources/function_blocks

ADD ../data/fb/* .

# -------------------------------------
# Docker entrypoint
WORKDIR /root
COPY --chmod=0700 dinasore/docker-entrypoint.sh .

# Ports: no need to expose because we are using the host's NIC
#   4DIAC-IDE: 61499
#   OPC-UA: 4840
CMD ["/bin/bash", "-c", "/usr/sbin/sshd -D & /root/docker-entrypoint.sh"]
