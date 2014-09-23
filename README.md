placequery
==========
Simple web server that acts as an interface to the [placesindex] (https://github.com/oss/placesindex) completer.

#### Integration with web service
You can make the placequery server look like it's part of your Apache service by adding something like this to your httpd.conf:
```
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
...
ProxyPass /pq http://localhost:8080/
ProxyPassReverse / http://localhost:8080/
```
Now you can make requests with `http://localhost/pq?search=hill` instead of `http://localhost:8080/?search=hill`
