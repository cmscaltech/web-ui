All the /api/ endpoint requests are redirected to a wsgi python app. Everything
else are static files. But we host all ("/api/" endpoint and static files) under
apache, in a virtualhost settings.

### Installing Apache2

```
$ sudo apt-get install apache2 libapache2-mod-wsgi
```

### Downloading the source code

```
$ sudo mkdir -p /var/www/ofng/
$ cd /var/www/ofng
$ sudo git clone https://github.com/of-ng/web-ui.git
$ cd web-ui/
```

### Create the Apache virtualhost

Copy, or create a symlink of Apache config file to your apache default config
dir:

```
$ sudo ln -s /var/www/ofng/web-ui/apache.conf /etc/apache2/sites-enabled/ofng.conf
```

Edit this file and change `yourdomain.com` to your webserver domain.

### Install dependencies

```
$ sudo pip install -r requirements.txt
$ git clone https://github.com/snlab/python-odl.git
$ cd python-odl
$ sudo python setup.py install
```

### Edit your config file

Edit the file `settings/production.py` and configure the variables
properly.


## Restart apache

```
$ sudo service apache2 restart
```

## Test it

Point your browser to `http://ofng.yourdomain.com`.

## Authors

This is a collaborative project between SPRACE (From São Paulo State University
\- Unesp) and Caltech (California Institute of Technology).

For a complete list of people, please see the AUTHORS.md file.
