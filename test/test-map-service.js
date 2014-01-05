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

//can't "use strict" because we need to load mock objects in global scope
var should = require("should");
var assert = require("assert");
var target = require("../geo/assets/www/js/map-service.js");
var sinon = require("sinon");

FileTransfer = function () {
};
FileTransfer.prototype = {};
$ = {};
$.isArray = function(value) { return value instanceof Array };

describe("mapService", function () {
    var mapService,
        success,
        error,
        mockContext = {},
        configPlainBrowser = {
            serviceUrl: "http://foo.bar.baz",
            isPlainBrowser: function () {
                return true;
            }
        },
        configDevice = {
            serviceUrl: "http://foo.bar.baz",
            isPlainBrowser: function () {
                return false;
            }
        },
        metaData = {
            bounds: "-172.9688,-3.6011,-21.9727,72.101",
            center: "-101.25,39.9772,3",
            minzoom: "0",
            maxzoom: "7",
            name: "base-world",
            description: "the base world map",
            attribution: "",
            legend: "",
            template: "",
            version: "1.0.0"
        },
        metaDataMatch = {
            bounds: sinon.match("-172.9688,-3.6011,-21.9727,72.101"),
            center: {
                lat: sinon.match("39.9772"),
                lng: sinon.match("-101.25"),
                zoom: sinon.match("3")
            },
            minzoom: sinon.match("0"),
            maxzoom: sinon.match("7"),
            name: sinon.match("base-world"),
            description: sinon.match("the base world map"),
            attribution: sinon.match(""),
            legend: sinon.match(""),
            template: sinon.match(""),
            version: sinon.match("1.0.0")
        },
        mapDataMatch = {
            defaults: {
                tileLayer: sinon.match(null),
                maxZoom: sinon.match(metaData.maxzoom),
                minZoom: sinon.match(metaData.minzoom),
                tms: sinon.match(true),
                path: {
                    weight: sinon.match(10),
                    color: sinon.match("#800000"),
                    opacity: sinon.match(1)
                },
                tileLayerOptions: {
                    tms: sinon.match(true),
                    maxZoom: sinon.match(metaData.maxzoom)
                }
            },
            maxBounds: {
                southWest: {
                    lat: sinon.match(-3.6011),
                    lng: sinon.match(-172.9688)
                },
                northEast: {
                    lat: sinon.match(72.101),
                    lng: sinon.match(-21.9727)
                }
            }
        };

    beforeEach(function (done) {
        success = sinon.spy();
        error = sinon.spy();
        done();
    });

    describe("#loadDb", function () {
        it("in browser, should load from remote server", function (done) {
            var mockContext = sinon.spy();
            mapService = target.mapService(mockContext, configPlainBrowser);
            mapService.loadDb("foo", success, error);
            //this doesn't do much but set the internal db name, so not much to test
            assert(success.calledWith(sinon.match.object));
            assert(mockContext.notCalled);
            done();
        });
        it("in device, opens existing database", function (done) {
            mockContext.sqlitePlugin = {};
            mockContext.sqlitePlugin.databaseExists = sinon.stub();
            mockContext.sqlitePlugin.databaseExists.withArgs("foo").yields([true]);
            mockContext.sqlitePlugin.openDatabase = sinon.spy();

            mapService = target.mapService(mockContext, configDevice);
            mapService.loadDb("foo", success, error);
            assert(mockContext.sqlitePlugin.databaseExists.calledOnce);
            assert(mockContext.sqlitePlugin.openDatabase.calledWith(sinon.match({name: "foo", create: false})));
            assert(success.calledOnce);
            assert(error.notCalled);
            done();
        });
        it("in device, downloads new database", function (done) {
            mockContext.sqlitePlugin = {};
            mockContext.sqlitePlugin.databaseExists = sinon.stub();
            mockContext.sqlitePlugin.databaseExists.withArgs("foo").yields([false]);
            mockContext.sqlitePlugin.openDatabase = sinon.spy();
            mockContext.sqlitePlugin.getDatabasePath = sinon.stub();
            mockContext.sqlitePlugin.getDatabasePath.withArgs("foo").yields("/path/to/db");
            var entry = sinon.spy();
            FileTransfer.prototype.download = sinon.stub();
            FileTransfer.prototype.download.withArgs(configDevice.serviceUrl + "/databases/foo", "/path/to/db/foo", sinon.match.func).yields(entry);

            mapService = target.mapService(mockContext, configDevice);
            mapService.loadDb("foo", success, error);

            assert(mockContext.sqlitePlugin.databaseExists.calledOnce);
            assert(mockContext.sqlitePlugin.openDatabase.calledWith(sinon.match({name: "foo", create: false})));
            assert(success.calledOnce);
            assert(error.notCalled);
            done();
        });
    });

    describe("#loadTileData", function () {
        it("in browser, loads tile data from remote service", function (done) {
            mapService = target.mapService(mockContext, configPlainBrowser);
            mapService.loadDb("foo", function (mapDb) {
                $.ajax = sinon.stub();
                var data = {tile_data: sinon.spy()}, status = sinon.spy(), xhr = sinon.spy();

                $.ajax.withArgs(sinon.match({
                    url: sinon.match(configPlainBrowser.serviceUrl + "/tile/1/1/1"),
                    type: sinon.match("GET"),
                    data: sinon.match({db: "foo"}),
                    success: sinon.match.func,
                    error: sinon.match.func
                })).yieldsTo("success", data, status, xhr);

                mapDb.loadTileData(1, 1, 1, success, error);
                assert(success.calledWithMatch(sinon.match.same(data.tile_data)));
                assert(error.notCalled);
                done();
            }, function () {
                should.fail('Error should not occur!');
                done();
            });
        });
        it("in device, loads tile data from local db", function (done) {
            mockContext.sqlitePlugin = {};
            mockContext.sqlitePlugin.databaseExists = sinon.stub();
            mockContext.sqlitePlugin.databaseExists.withArgs("foo").yields([true]);
            mockContext.sqlitePlugin.openDatabase = sinon.stub();
            var database = sinon.spy();
            database.transaction = sinon.stub();
            mockContext.sqlitePlugin.openDatabase.returns(database);
            var txn = sinon.spy();
            txn.executeSql = sinon.stub();
            database.transaction.yields(txn);
            var result = (function () {
                var items = [
                    {tile_data: sinon.spy()}
                ];

                return {
                    rows: {
                        item: function (x) {
                            return items[x];
                        },
                        length: items.length
                    }
                }
            })();
            txn.executeSql.withArgs("SELECT tile_data FROM images INNER JOIN map ON images.tile_id = map.tile_id WHERE " +
                "zoom_level = ? AND tile_column = ? AND tile_row = ?", [1, 1, 1],
                sinon.match.func, sinon.match.func).yields(txn, result);

            mapService = target.mapService(mockContext, configDevice);
            mapService.loadDb("foo", function (mapDb) {
                mapDb.loadTileData(1, 1, 1, success, error);
                assert(success.calledWithMatch(sinon.match.same(result.rows.item(0).tile_data)));
                assert(error.notCalled);
                done();
            }, function () {
                should.fail("Error should not occur!");
                done();
            });

        })
    });

    describe("#getMetadata", function () {
        it("in browser, retrieves metadata from remote service", function (done) {
            $.ajax = sinon.stub();
            var status = sinon.spy(), xhr = sinon.spy();

            $.ajax.withArgs(sinon.match({
                url: sinon.match(configPlainBrowser.serviceUrl + "/metadata"),
                type: sinon.match("GET"),
                data: sinon.match({db: "foo"}),
                success: sinon.match.func,
                error: sinon.match.func
            })).yieldsTo("success", metaData, status, xhr);

            mapService = target.mapService(mockContext, configPlainBrowser);
            mapService.loadDb("foo", function (mapDb) {
                mapDb.getMetadata(success, error);
                assert(success.calledWithMatch(sinon.match(metaDataMatch), sinon.match(mapDataMatch)));
                assert(error.notCalled);
                done();
            }, function () {
                should.fail("Error should not occur!");
                done();
            });
        });
        it("in device, retrieves metadata from local db", function (done) {
            mockContext.sqlitePlugin = {};
            mockContext.sqlitePlugin.databaseExists = sinon.stub();
            mockContext.sqlitePlugin.databaseExists.withArgs("foo").yields([true]);
            mockContext.sqlitePlugin.openDatabase = sinon.stub();
            var database = sinon.spy();
            database.transaction = sinon.stub();
            mockContext.sqlitePlugin.openDatabase.returns(database);
            var txn = sinon.spy();
            txn.executeSql = sinon.stub();
            database.transaction.yields(txn);
            var result = (function () {
                var items = [
                    {name: "bounds", value: "-172.9688,-3.6011,-21.9727,72.101"},
                    {name: "center", value: "-101.25,39.9772,3"},
                    {name: "minzoom", value: "0"},
                    {name: "maxzoom", value: "7"},
                    {name: "name", value: "base-world"},
                    {name: "description", value: "the base world map"},
                    {name: "attribution", value: ""},
                    {name: "legend", value: ""},
                    {name: "template", value: ""},
                    {name: "version", value: "1.0.0"}
                ];

                return {
                    rows: {
                        item: function (x) {
                            return items[x];
                        },
                        length: items.length
                    }
                }
            })();
            txn.executeSql.withArgs("SELECT * FROM metadata", [],
                sinon.match.func, sinon.match.func).yields(txn, result);

            mapService = target.mapService(mockContext, configDevice);
            mapService.loadDb("foo", function (mapDb) {
                mapDb.getMetadata(success, error);
                assert(success.calledWithMatch(sinon.match(metaDataMatch), sinon.match(mapDataMatch)));
                assert(error.notCalled);
                done();
            }, function () {
                should.fail("Error should not occur!");
                done();
            });

        })

    });
})
;