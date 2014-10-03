placequery
==========
Simple node.js web server that acts as an interface to the [placesindex] (https://github.com/oss/placesindex) completer.

Accepts GET requests as queries and uses the [JSend](http://labs.omniti.com/labs/jsend) spec for responses.

## Setup
Make a copy of `config.yaml.sample`, adjust it to suit your server configuration, and save it as `config.yaml` in the
same directory as `placequery.js`.

#### SSL
To enable SSL directly, set `server.ssl.enabled` to `true` in `config.yaml` and provide paths for the `key` and `cert`
files, where `key` contains the private key of the server in PEM format and `cert` contains the certificate key of the
server in PEM format. If you need more details, see the [Node.js SSL documentation](http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener).

Alternatively, see [Integration with web service](#integration) for a way to tunnel traffic between the end user and a host already configured for HTTPS.

## Usage
Queries are made with GET requests to the server's root directory, e.g. [http://localhost:8080/?search=hill](). To make 
nicer requests like [http://localhost/pq?search=hill](), see [Integration with web service](#integration).

##### Search by title, building code, or ID
[http://localhost/pq?search=old]() returns:
```javascript
{
    "status": "success",
    "data": {
        "places": [
            {
                "title": "Old Gibbons Garage",
                "id": "8435_5455Old Gibbons Garage"
            },
            {
                "title": "Old Queens",
                "id": "3000_4595Old Queens"
            }
        ]
    }
}
```

##### Search by location
[http://localhost/pq?latitude=40.498760&longitude=-74.446266]() returns:
```javascript
{
    "status": "success",
    "data": {
        "places": [
            {
                "title": "Old Queens",
                "id": "3000_4595Old Queens"
            },
            {
                "title": "Geology Hall",
                "id": "3002_4597Geology Hall"
            },
            {
                "title": "Van Nest Hall",
                "id": "3001_4596Van Nest Hall"
            },
            ...
        ]
    }
}
```

##### Get single place
With IDs returned in the search results you can get the full JSON entry for a particular building.

[http://localhost/pq?id=3000_4595Old%20Queens]() returns:
```javascript
{
    "status": "success",
    "data": {
        "place": {
            "title": "Old Queens",
            "description": "Old Queens, originally called the Queens Building...",
            "cid": "C71741",
            "building_id": "4595",
            "building_number": "3000",
            "campus_code": "10",
            "campus_name": "College Avenue",
            "location": {
              ...
            },
            "offices": [
              ...
            ],
            "id": "3000_4595Old Queens"
        }
    }
}
```

#### <a name="integration"></a>Integration with web service
You can make the placequery server look like it's part of your Apache service by adding something like this to your 
`httpd.conf` (adjust the port and domain to match the settings in `config.yaml`):
```
ProxyPass /pq http://localhost:8080/
```
Make sure these lines are present and uncommented:
```
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
```
Now you can make requests with [http://localhost/pq?search=hill]() instead of [http://localhost:8080/?search=hill]().

This is also an easy way to provide SSL capability for placequery: add the ProxyPass directives to the configuration
of an HTTPS-enabled (virtual) host, and traffic between the end user and your gateway server will be encrypted.
Ensure that backend communications between the gateway and placequery server are safe.

See Apache's [mod proxy](http://httpd.apache.org/docs/current/mod/mod_proxy.html#proxypass) documentation for more info.
