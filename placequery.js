var http = require('http');
var url = require('url');
var lunr = require('lunr');
var kdtree = require('kdtree');
var fs = require('fs');
var places = JSON.parse(fs.readFileSync('./places.txt', 'utf8'));

console.log('Starting placequery server');

process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
    var q = process.stdin.read();
    if(q != null) {
	process.stdout.write('Results: ');
	console.log(places.index.search(q));
    }
});



