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

"use strict";

/**
 * Provides abstraction layer for loading tile data either from local db or from remote service
 */
var mapService = function (context, config) {
    var dbBuilder = function (dbName, onSuccess, onError) {
        var root = {};

        var loadDb = function (dbName, onSuccess, onError) {
            console.log("loadDb - loading: " + dbName);
            root.dbName = dbName;
            if (config.isPlainBrowser()) {
                console.log("loadDb - loading as plain browser: " + dbName);
                root.database = dbName;
                onSuccess(dbObject);
            } else {
                console.log("loadDb - loading as device: " + dbName);
                fetchDatabase(onSuccess, onError);
            }
        };

        var fetchDatabase = function (onSuccess, onError) {
            var dbName = root.dbName;
            var remoteFile = config.serviceUrl + "/databases/" + dbName;
            var openDbAndProceed = function () {
                root.database = context.sqlitePlugin.openDatabase({name: root.dbName, create: false});
                onSuccess && onSuccess(dbObject);
            };
            console.log("fetchDatabase, checking if db exists");
            context.sqlitePlugin.databaseExists(dbName, function (retArray) {
                var exists = false;
                if (typeof retArray === "boolean") {
                    exists = retArray;
                } else if ($.isArray(retArray)) {
                    exists = retArray[0];
                } else {
                    console.log("Unknown return type for retArray: " + (typeof retArray));
                }

                if (exists) {
                    console.log("Database file [" + dbName + "] already exists, opening db");
                    openDbAndProceed();
                } else {
                    console.log("fetchDatabase, db does not exist, fetching from service");
                    // file does not exist
                    //need to download the db file to the same place SQLite plugin will be trying to load it,
                    //which is in the database path
                    context.sqlitePlugin.getDatabasePath(dbName, function (dbPath) {
                        // file does not exist
                        console.log("Database file [" + dbName + "] does not exist, downloading file from " + remoteFile);

                        var ft = new FileTransfer();

                        ft.download(remoteFile, dbPath + "/" + dbName, function (entry) {
                            console.log("download complete: " + entry.fullPath);
                            openDbAndProceed();
                        }, function (error) {
                            console.log("error with download", JSON.stringify(error));
                            onError && onError(JSON.stringify(error));
                        });
                    });
                }
            });
        };

        var loadTileDataFromLocalDb = function (x, y, z, onSuccess, onError) {
            root.database.transaction(function (tx) {
                tx.executeSql("SELECT tile_data FROM images INNER JOIN map ON images.tile_id = map.tile_id WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?", [z, x, y], function (tx, res) {
                    if (!res || !res.rows || res.rows.length != 1) {
                        console.log("Expected tile query to return exactly one row, but returned: " + (res && res.rows && res.rows.length));
                    } else {
                        onSuccess(res.rows.item(0).tile_data);
                    }
                }, function (error) {
                    onError("Error occurred while querying tile db: " + JSON.stringify(error));
                });
            });
        };

        var loadTileDataFromNode = function (x, y, z, onSuccess, onError) {
            var url = config.serviceUrl + "/tile/" + x + "/" + y + "/" + z;
            console.log("Loading tile using url: " + url + ", with parameters: " + JSON.stringify({db: root.database}));
            $.ajax({
                url: url,
                type: "GET",
                data: {db: root.database},
                success: function (data, status, xhr) {
                    console.log("loaded data from node [" + x + "," + y + "," + z + "]");
                    onSuccess(data.tile_data);
                },
                error: function (xhr, status, error) {
                    console.log("Error occurred: " + (status ? status + ", " : "") + (error ? JSON.stringify(error) : ""));
                    onError && onError("Error occurred: " + (status ? status + ", " : "") + (error ? JSON.stringify(error) : ""));
                }
            });
        };

        var getMetaDataFromNode = function (onSuccess, onError) {
            var url = config.serviceUrl + "/metadata";
            console.log("Getting map metadata from url: " + url + ", with parameters: " + JSON.stringify({db: root.database}));
            $.ajax({
                url: url,
                type: "GET",
                data: {db: root.database},
                success: function (data, status, xhr) {
                    root.metatadata = data;
                    console.log("loaded data from node: " + JSON.stringify(data));
                    onSuccess(data);
                },
                error: function (xhr, status, error) {
                    console.log("Error occurred: " + (status ? status + ", " : "") + (error ? JSON.stringify(error) : ""));
                    onError && onError("Error occurred: " + (status ? status + ", " : "") + (error ? JSON.stringify(error) : ""));
                }
            });
        };

        var getMetaDataFromLocalDb = function (onSuccess, onError) {
            root.database.transaction(function (tx) {
                tx.executeSql("SELECT * FROM metadata", [], function (tx, res) {
                    if (!res || !res.rows) {
                        console.log("No metadata found");
                    } else {
                        console.log("processing rows...");
                        var metadata = {};
                        for (var i = 0; i < res.rows.length; i++) {
                            var row = res.rows.item(i);
                            console.log("process row: " + i + ", name: " + row.name + ", value: " + row.value);
                            metadata[row.name] = row.value;
                        }
                        console.log("metadata: " + JSON.stringify(metadata));
                        root.metatadata = metadata;
                        onSuccess(metadata);
                    }
                }, function (error) {
                    onError && onError("Error occurred while querying tile db: " + JSON.stringify(error));
                });
            });
        };

        var dbObject = {

            close: function () {
                if (!config.isPlainBrowser()) {
                    root.database.close();
                }
            },

            /**
             * Load tile data from pre-determined tile source.
             * @param x The X coordinate of the tile
             * @param y The y coordinate of the tile
             * @param z The z (or zoom) coordinate of the tile
             * @param onSuccess Callback called if successful, will pass the data in base64 encoded form
             * @param onError Callback called if an error occurs
             */
            loadTileData: function (x, y, z, onSuccess, onError) {
                if (config.isPlainBrowser()) {
                    loadTileDataFromNode(x, y, z, onSuccess, onError);
                } else {
                    loadTileDataFromLocalDb(x, y, z, onSuccess, onError);
                }
            },

            /**
             * Loads the metadata from the mapDB. Calls onSuccess with both the metadata and
             * a preloaded mapData structure, which contains defaults(minZoom, maxZoom, path, tileLayerOptions),
             * center, and maxbounds for the given map.
             *
             * @param onSuccess
             * @param onError
             */
            getMetadata: function (onSuccess, onError) {
                var success = function (metadata) {
                    if (!metadata) {
                        console.log("Metadata must not be null!");
                        onError && onError("Metadata must not be null");
                        return;
                    }
                    if (!metadata.bounds || !metadata.center || !metadata.minzoom || !metadata.maxzoom) {
                        console.log("metadata seems incomplete - should have bounds, center, minzoom, and maxzoom");
                        onError && onError("metadata seems incomplete - should have bounds, center, minzoom, and maxzoom");
                        return;
                    }

                    var bounds = metadata.bounds.split(",");
                    var centerCoords = metadata.center.split(",");
                    metadata.center = {
                        lat: centerCoords[1],
                        lng: centerCoords[0],
                        zoom: centerCoords[2]
                    };

                    var mapData = {
                        defaults: {
                            tileLayer: null,
                            maxZoom: metadata.maxzoom,
                            minZoom: metadata.minzoom,
                            tms: true,
                            path: {
                                weight: 10,
                                color: "#800000",
                                opacity: 1
                            },
                            tileLayerOptions: {
                                tms: true,
                                maxZoom: metadata.maxzoom
                            }
                        },
                        center: {
                            lat: centerCoords[1],
                            lng: centerCoords[0],
                            zoom: centerCoords[2]
                        },
                        maxBounds: {
                            southWest: {
                                lat: bounds[1],
                                lng: bounds[0]
                            },
                            northEast: {
                                lat: bounds[3],
                                lng: bounds[2]
                            }
                        }
                    };
                    onSuccess(metadata, mapData)
                };

                if (root.metatadata) {
                    success(root.metatadata);
                }

                if (config.isPlainBrowser()) {
                    getMetaDataFromNode(success, onError);
                } else {
                    getMetaDataFromLocalDb(success, onError);
                }
            }
        };


        loadDb(dbName, onSuccess, onError);
    };

    return {
        loadDb: function (dbName, onSuccess, onError) {
            dbBuilder(dbName, onSuccess, onError);
        }
    };

};

/**
 * Exposes map service for injection
 */
myAppServices.factory('mapService', function (configService) {
    return mapService(window, configService);
});

//expose for testing through mocha/node
if (typeof exports !== "undefined") {
    exports.mapService = mapService;
}