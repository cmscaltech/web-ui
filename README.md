# OpenFlow Next Generation - Web User Interface 

This is a fork of of-ng web ui component. This component is responsible for display
network topology in a GUI to users. Also control some basic operations like
list, insert and remove flows.

## Installation

Please, refer to INSTALL.debian for detailed instructions to install in Debian based distros and INSTALL.redhat to install in Red Hat based distros.

## Docker

You can use docker container to start a server instance quickly. Just make sure you have installed docker and follow the commands:

    ./build.sh
    cp -r settings settings.docker

    # Manually: Config your own settings file
    # In this step, you need to modify the file settings.docker/production.py
    # You have to change the following parts at least:
    # 1) Change the odl_server
    # 2) Change the rrd_dir = "/var/log/rrd/ofng"
    # 3) Add rrd_path = "/var/log/rrd/ofng"
    # 4) Add steps = <interval_time>

    ./run.sh

## Authors

The original project is a collaborative project between SPRACE (From São Paulo State University 
\- Unesp) and Caltech (California Institute of Technology).

For a complete list of people, please see the AUTHORS.md file.

This fork is maintained by Jensen Zhang (jingxuan.n.zhang@gmail.com).

