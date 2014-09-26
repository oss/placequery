var _ = require('underscore');
var yaml = require('js-yaml');
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var completer = require('./placesindex/completer.js');

/**
 * Strips everything but title and ID from search results
 * @param {Array} results Completer results
 * @return {Array} Completer results pared down to title and ID
 */
function getIds(results) {
    var output = [];
    
    results.forEach(function(obj) {
	output.push({title: obj['title'], id: obj['id']});
    });

    return output;
}

/**
 * Creates a JSend style output object
 * @param {String} status success, fail, or error
 * @param {String} dataFieldName
 * @param {Object} data
 * @return {Object}
 */
function jsendOutput(status, dataFieldName, data) {
    var output = {status: status, data:{}};
    output['data'][dataFieldName] = data;
    return output;
}

/**
 * Write response to client
 * @param {http.ServerResponse} res Server response object
 * @param {number} code HTTP response code
 * @param {Object} data
 */
function respond(res, code, data) {
    res.writeHead(code, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(data));
    res.end();
}

/** Validate a number parameter */
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// Load config & places db
try {
    var config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));
    var places = JSON.parse(fs.readFileSync(config.paths.database, 'utf8'));
} catch (err) {
    console.error(err);
    process.exit(1);
}

// Listener function for handling requests
var requestListener = function(req, res) {
    var parsedUrl = url.parse(req.url, true);

    // Log query
    if(config.log.verbose) {
	console.log('Processing query');
	for(get in parsedUrl['query']) {
	    console.log(get + ': ' + parsedUrl['query'][get]);
	}
    }

    // Searching by text
    searchQuery = parsedUrl['query']['search'];
    if(searchQuery != undefined) {
	var results = getIds(completer.complete(places, searchQuery));
	var output = jsendOutput('success', 'places', results);
	respond(res, 200, output);
	return;
    } 

    // Searching by location
    lonQuery = parsedUrl['query']['longitude'];
    latQuery = parsedUrl['query']['latitude'];
    if(lonQuery != undefined && latQuery != undefined) {
	if(isNumber(lonQuery) && isNumber(latQuery)) {
	    // Decide maximum number of kdtree results
	    var limit = config.limits.nearby.default || 10;
	    var qLimit = parsedUrl['query']['limit'];
	    if(qLimit != undefined && isNumber(qLimit) && qLimit > 0) {
		if(qLimit < config.limits.nearby.maximum) limit = qLimit;
		else limit = config.limits.nearby.maximum;
	    }

	    var results = getIds(completer.nearby(places, latQuery, lonQuery, limit));
	    var output = jsendOutput('success', 'places', results.reverse()); // Nearest places tend to end of array
	    respond(res, 200, output);
	} else {
	    var output = jsendOutput('fail', 'message', 'Longitude and latitude arguments must be numbers');
	    respond(res, 400, output);
	}
	return;
    }

    // Get specific place by ID
    idQuery = parsedUrl['query']['id'];
    if(idQuery != undefined) {
	var place = places['all'][idQuery];
	if(place != undefined) {
	    var output = jsendOutput('success', 'place', place);
	    respond(res, 200, output);
	} else {
	    var output = jsendOutput('fail', 'message', 'Invalid ID');
	    respond(res, 404, output);
	}
	return;
    }

    // No valid query
    var output = jsendOutput('fail', 'message', 'No valid query supplied');
    respond(res, 400, output);
    console.log('Invalid query');
};

// Launch the HTTP server
console.log('Starting placequery server');
console.log('There are ' + _.size(places['all']) + ' places in the database.');

if(config.server.ssl.enabled) {
    try {
	var options = {
	    key: fs.readFileSync(config.server.ssl.key),
	    cert: fs.readFileSync(config.server.ssl.cert)
	};
	var server = https.createServer(options, requestListener);
    } catch (err) {
	console.error(err);
	process.exit(1);
    }
} else {
    var server = http.createServer(requestListener);
}

server.listen(config.server.port, config.server.address);
console.log('Server listening on port ' + config.server.port);
