var http = require('http');
var url = require('url');
var completer = require('./placesindex/completer.js');
var fs = require('fs');
var places = JSON.parse(fs.readFileSync('./places.txt', 'utf8'));

var serverAddr = "127.0.0.1";
var serverPort = 8080;

console.log('Starting placequery server');

var server = http.createServer(function(req, res) {
    console.log('Processing query');

    res.writeHead(200, {'Content-Type': 'application/json'});
    
    var parsedUrl = url.parse(req.url, true);
    for(get in parsedUrl['query']) {
	console.log(get + ": " + parsedUrl['query'][get]);
    }

    // Searching by text
    searchQuery = parsedUrl['query']['search'];
    if(searchQuery != undefined) {
	res.write(JSON.stringify(completer.complete(places, searchQuery)));
	res.end();
	return;
    } 

    // Searching by location
    lonQuery = parsedUrl['query']['longitude'];
    latQuery = parsedUrl['query']['latitude'];
    if(lonQuery != undefined && latQuery != undefined) {
	res.write(JSON.stringify(completer.nearby(places, latQuery, lonQuery)));
	res.end();
	return;
    }

    // No valid query
    res.write('{"error": "No query"}');
    res.end();
});

server.listen(serverPort, serverAddr);
console.log('Server listening on port ' + serverPort);
