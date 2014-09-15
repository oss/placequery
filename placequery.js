var _ = require('underscore');
var http = require('http');
var url = require('url');
var completer = require('./placesindex/completer.js');
var fs = require('fs');

// Config options
var placesFile = './places.txt';
var serverAddr = "127.0.0.1";
var serverPort = 8080;
var numNearbyResults = 10;

// Load places db
var places;
try {
    places = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
} catch(err) {
    console.error(err);
    process.exit(1);
}

// Strips everything but title and ID from search results
function getIds(results) {
    var output = [];
    
    results.forEach(function(obj) {
	output.push({title: obj['title'], id: obj['id']});
    });

    return output;
}

// HTTP server
console.log('Starting placequery server');
console.log('There are ' + _.size(places['all']) + ' places in the database.');

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
	var results = completer.complete(places, searchQuery);
	var output = getIds(results);
	res.write(JSON.stringify(output));
	res.end();
	return;
    } 

    // Searching by location
    lonQuery = parsedUrl['query']['longitude'];
    latQuery = parsedUrl['query']['latitude'];
    if(lonQuery != undefined && latQuery != undefined) {
	var results = completer.nearby(places, latQuery, lonQuery, numNearbyResults);
	var output = getIds(results);
	res.write(JSON.stringify(output));
	res.end();
	return;
    }

    // Get specific place by ID
    idQuery = parsedUrl['query']['id'];
    if(idQuery != undefined) {
	res.write(JSON.stringify(places['all'][idQuery]));
	res.end();
	return;
    }

    // No valid query
    res.write('{"error": "No query"}');
    res.end();
});

server.listen(serverPort, serverAddr);
console.log('Server listening on port ' + serverPort);
