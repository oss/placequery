placequery
==========
Simple node.js web server that acts as an interface to the [placesindex] (https://github.com/oss/placesindex) completer.

Uses the [JSend](http://labs.omniti.com/labs/jsend) spec for responses.

## Usage
Queries are made with GET requests to the server's root directory, e.g. `http://localhost:8080/?search=hill` (see [Integration with web service](#integration) for how to make nicer requests like `http://localhost/pq?search=hill`).

##### Search by title
```
Parameter: search
Returns: JSON array called "places"
```

##### Search by location
```
Parameters: longitude, latitude
Returns: JSON array called "places"
```

##### Get single place
```
Parameters: id
Returns: JSON object called "place"
```

#### <a name="integration"></a>Integration with web service
You can make the placequery server look like it's part of your Apache service by adding something like this to your httpd.conf:
```
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
...
ProxyPass /pq http://localhost:8080/
ProxyPassReverse / http://localhost:8080/
```
Now you can make requests with `http://localhost/pq?search=hill` instead of `http://localhost:8080/?search=hill`
