#!/bin/bash

docker run \
       -dit --name web-ui \
       -v $(pwd)/apache.conf:/var/www/ofng/web-ui/apache.conf \
       -v $(pwd)/apache.wsgi:/var/www/ofng/web-ui/apache.wsgi \
       -v $(pwd)/app.py:/var/www/ofng/web-ui/app.py \
       -v $(pwd)/settings.docker:/var/www/ofng/web-ui/settings \
       -v $(pwd)/public_html:/var/www/ofng/web-ui/public_html \
       -v $(pwd)/secret:/var/www/ofng/web-ui/secret \
       -v $(pwd)/rrd.docker:/var/log/rrd/ofng \
       -p 8888:80 \
       ofng
