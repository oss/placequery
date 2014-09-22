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
var logQueries = true;

// Load places db
var places;
try {
    places = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
} catch (err) {
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

// Create JSend style output object
function jsendOutput(status, dataFieldName, data) {
    var output = {status: status, data:{}};
    output['data'][dataFieldName] = data;
    return output;
}

// Send response to client
function respond(res, code, data) {
    res.writeHead(code, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(data));
    res.end();
}

// Validate numbers
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// HTTP server
console.log('Starting placequery server');
console.log('There are ' + _.size(places['all']) + ' places in the database.');

var server = http.createServer(function(req, res) {
    var parsedUrl = url.parse(req.url, true);

    // Log query
    if(logQueries) {
	console.log('Processing query');
	for(get in parsedUrl['query']) {
	    console.log(get + ": " + parsedUrl['query'][get]);
	}
    }

    // Searching by text
    searchQuery = parsedUrl['query']['search'];
    if(searchQuery != undefined) {
	var results = getIds(completer.complete(places, searchQuery));
	var output = jsendOutput("success", "places", results);
	respond(res, 200, output);
	return;
    } 

    // Searching by location
    lonQuery = parsedUrl['query']['longitude'];
    latQuery = parsedUrl['query']['latitude'];
    if(lonQuery != undefined && latQuery != undefined) {
	if(isNumber(lonQuery) && isNumber(latQuery)) {
	    var results = getIds(completer.nearby(places, latQuery, lonQuery, numNearbyResults));
	    var output = jsendOutput("success", "places", results);
	    respond(res, 200, output);
	} else {
	    var output = jsendOutput("fail", "message", "Longitude and latitude arguments must be numbers");
	    respond(res, 400, output);
	}
	return;
    }

    // Get specific place by ID
    idQuery = parsedUrl['query']['id'];
    if(idQuery != undefined) {
	var place = places['all'][idQuery];
	if(place != undefined) {
	    var output = jsendOutput("success", "place", place);
	    respond(res, 200, output);
	} else {
	    var output = jsendOutput("fail", "message", "Invalid ID");
	    respond(res, 404, output);
	}
	return;
    }

    // No valid query
    var output = jsendOutput("fail", "message", "No valid query supplied");
    respond(res, 400, output);
});

server.listen(serverPort, serverAddr);
console.log('Server listening on port ' + serverPort);
