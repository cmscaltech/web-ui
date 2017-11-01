############################################################
# Dockerfile to build OFNG Web UI Container Based on Ubuntu
############################################################

# Set the base image to Ubuntu
FROM ubuntu

# File Author / Maintainer
MAINTAINER Jensen Zhang <jingxuan.n.zhang@gmail.com>

# Update the sources list
RUN apt-get update

# Install basic applications
RUN apt-get install -y tar git curl vim wget dialog net-tools build-essential supervisor

# Install Python and Basic Python Tools
RUN apt-get install -y python python-dev python-distribute python-pip librrd-dev

# Install Apache and WSGi Mod
RUN apt-get install -y apache2 libapache2-mod-wsgi

# Create mount point for web ui
RUN mkdir -p /var/www/ofng/web-ui

# Alias Apache Configuration
RUN ln -s /var/www/ofng/web-ui/apache.conf /etc/apache2/sites-enabled/ofng.conf

# Install dependencies
ADD requirements.txt /requirements.txt
RUN pip install -r /requirements.txt
RUN git clone https://github.com/snlab/python-odl.git && cd python-odl && python setup.py install

# Install rrd watchdog
RUN git clone https://github.com/kytos/stats-watchdog
RUN sed -i 's/steps = 60//' /stats-watchdog/scripts/ofng-watchdog \
    && cd stats-watchdog \
    && pip install -r requirements.txt \
    && python setup.py install \
    && rm -f /stats-watchdog/settings/default.py
RUN ln -s /var/www/ofng/web-ui/settings/production.py /stats-watchdog/settings/default.py
ENV PYTHONPATH /stats-watchdog

# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Supervisor configuration for apache2
RUN mkdir -p /var/lock/apache2 /var/run/apache2 /var/log/supervisor
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf
CMD ["/usr/bin/supervisord"]
