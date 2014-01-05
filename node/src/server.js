/*
 The MIT License (MIT)
 Copyright (c) 2014 David Winterbourne, Winterbourne Enterprises, LLC, dba Kaidad

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
 persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var fs = require('fs');
var app = express();
var testDataIds = require(__dirname + '/../../geo/assets/www/js/test-data.js').TEST_DATA_BUNDLE_IDS;
var testDataMeta = require(__dirname + '/../../geo/assets/www/js/test-data.js').TEST_DATA_META;


var baseDbDir = __dirname + '/../../geo/databases';

//attach static content so we can serve the app from node and thus
//mitigate cross-origin issues
console.log('Serving static content from "' + __dirname + '/../../geo/assets/www"');
console.log('Serving databases from "' + __dirname + '/../../geo/databases"');
app.use('/databases', express.static(__dirname + '/../../geo/databases'));
app.use(express.static(__dirname + '/../../geo/assets/www'));
app.use(express.static(__dirname + '/../../geo'));

app.get('/tile/:x/:y/:z', function (req, res) {
    var db = req.query.db;
    if (db === null || typeof db === 'undefined') {
        res.send(400, '{ error: "expected valid db"]');
        return;
    }

    db = baseDbDir + '/' + db;
    console.log('get /tile/' + req.params.x + '/' + req.params.y + '/' + req.params.z + ' - db: ' + db);
    res.set('Content-Type', 'application/json');
    getTile(db, req.params.x, req.params.y, req.params.z, function (data) {
        var responseString = '{"tile_data":"' + data + '"}';
        res.set('Content-Length', Buffer.byteLength(responseString));
        res.send(responseString);
    }, function (status, err) {
        res.send(status, '{ error: ' + err + '}');
    });
});

app.get('/metadata', function (req, res) {
    var db = req.query.db;
    console.log('#/metadata - query: ' + JSON.stringify(req.query));
    if (db === null || typeof db === 'undefined') {
        res.send(400, '{ error: "expected valid db"]');
        return;
    }

    db = baseDbDir + '/' + db;
    console.log('get /metadata - db: ' + db);
    res.set('Content-Type', 'application/json');
    getMetadata(db, function (data) {
        var responseString = JSON.stringify(data);
        console.log('Sending metadata: ' + responseString);
        res.set('Content-Length', Buffer.byteLength(responseString));
        res.send(responseString);
    }, function (status, err) {
        res.send(status, '{ error: ' + err + '}');
    });
});

/**
 * Returns the list of bundles filtered by filter
 */
app.get('/bundle', function (req, res) {
    var filter = req.query.filter;
    if (filter && filter === 'meta') {
        console.log('returning all bundle metadata in test-data');
        res.set('Content-Length', Buffer.byteLength(JSON.stringify(testDataMeta)));
        res.send(JSON.stringify(testDataMeta));
        return;
    }

    var bundles = [];

    var doReturn = (function () {
        var count = 0;
        return function() {
            if (++count < testDataIds.length) return;
            if (bundles.length != testDataIds.length) {
                console.log("Error while building list of all bundles - resulting list is shorter than list of testDataIds");
                res.send(500, '{ error: \'unable to load all bundles \'');
                return;
            }
            var responseAsString = JSON.stringify(bundles);
            res.set('Content-Length', Buffer.byteLength(responseAsString));
            res.send(responseAsString);
        }
    })();

    testDataIds.forEach(function(bundleId) {
        fs.readFile(__dirname + '/../../geo/bundles/' + bundleId + '/bundle.json', 'utf8', function (err, data) {
            if (err || !data) {
                console.log(err);
                res.send(500, '{ error: \'error reading all bundles\' }');
                return;
            }
            try {
                bundles.push(JSON.parse(data));
            } catch (e) {
                console.log('error parsing data: ' + e.message, e);
                res.send(500, '{ error: \'error parsing bundle data\' }');
                return;
            }
            doReturn();
        });
    });


});

/**
 * Returns the bundle.json for the given bundleId
 */
app.get('/bundle/:bundleId', function (req, res) {
    var bundleId = req.params.bundleId;
    console.log('loading bundle: ' + JSON.stringify(bundleId));
    if (!req.params.bundleId) {
        res.send(400, '{ error: \'bad request - must call with bundle ID \'}');
        return;
    }
    fs.readFile(__dirname + '/../../geo/bundles/' + req.params.bundleId + '/bundle.json', 'utf8', function (err, data) {
        if (err || !data) {
            console.log(err);
            res.send(404, '{ error: \'could not find bundle.json\' }');
            return;
        }
        console.log('returning bundle.json for bundle [' + req.params.bundleId + ']');
        res.set('Content-Length', Buffer.byteLength(data));
        res.send(data);
    });
});


var dbs = {};

function openDb(file) {
    var db = dbs[file];
    if (db === null || typeof db === 'undefined') {
        console.log('Opening db: ' + file);
        db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, function (error) {
            if (error) {
                console.log('Error occurred while attempting to open [' + file + ']: ' + error);
            } else {
                console.log('Successfully opened [' + file + ']');
            }
        });
    } else {
        console.log('Db already open: ' + file);
    }
    if (db) {
        console.log('Database open: ' + file);
        dbs[file] = db;
        return db;
    } else {
        console.log('Failed to open db: ' + file);
        return null;
    }
}

function closeAllDbs() {
    console.log('Closing database(s)');
    for (var db in dbs) {
        console.log('Closing db: ' + db);
        dbs[db].close();
    }
}

function getTile(dbFile, x, y, z, successCallback, errorCallback) {
    var db = openDb(dbFile);
    if (db === null || typeof db === 'undefined') {
        errorCallback(500, 'Expected valid db, but was null');
    } else {
        db.get('SELECT tile_data FROM images INNER JOIN map ON images.tile_id = map.tile_id WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?', [z, x, y], function (err, row) {
            if (err != null) {
                errorCallback(500, err);
                return;
            }
            if (!row) {
                console.log('Expected tile query for point [' + x + ',' + y + ',' + z + '] to return exactly one row');
                errorCallback(404, 'Expected tile query for point [' + x + ',' + y + ',' + z + '] to return exactly one row');
            } else {
                successCallback(new Buffer(row['tile_data']).toString('base64'));
            }
        });
    }
}

function getMetadata(dbFile, successCallback, errorCallback) {
    var db = openDb(dbFile);
    if (db === null || typeof db === 'undefined') {
        errorCallback(500, 'Expected valid db, but was null');
    } else {
        db.all('SELECT * FROM metadata', [], function (err, rows) {
            if (err != null) {
                errorCallback(500, err);
                return;
            }
            if (!rows) {
                console.log('Expected metadata to return some data!');
                errorCallback(404, 'No metadata found');
            } else {
                var metadata = {};
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    metadata[row.name] = row.value;
                }
                successCallback(metadata);
            }
        });
    }
}

var shutdown = function () {
    console.log('Got SIGINT - closing databases');
    closeAllDbs();
    process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGKILL', shutdown);

app.listen(3000);

console.log('Listening on port 3000')