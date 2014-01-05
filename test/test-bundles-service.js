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

myAppServices = {
    factory: function (name, callback) {

    }
};

var target = require("../geo/assets/www/js/bundles-service.js");
var sinon = require("sinon");
var testData = require("../geo/assets/www/js/test-data.js").TEST_DATA;
var testDataIds = require("../geo/assets/www/js/test-data.js").TEST_DATA_BUNDLE_IDS;

//mock the Connection and LocalFileSystem objects that phonegap ordinarily provides
Connection = {
    UNKNOWN: "unknown",
    ETHERNET: "ethernet",
    WIFI: "wifi",
    CELL_2G: "2g",
    CELL_3G: "3g",
    CELL_4G: "4g",
    CELL: "cellular",
    NONE: "none"
};

LocalFileSystem = {
    PERSISTENT: "persistent"
};

//mock the global context
context = {};
$ = {};
L = {};

L.LatLng = function (lat, lng) {
    this.lat = lat;
    this.lng = lng;
};
//borrowed from leaflet to make testing easier
L.LatLng.prototype.distanceTo = function (t) {
    var e = 6378137,
        i = Math.PI / 180,
        n = (t.lat - this.lat) * i,
        s = (t.lng - this.lng) * i,
        a = this.lat * i,
        r = t.lat * i,
        h = Math.sin(n / 2),
        l = Math.sin(s / 2),
        u = h * h + l * l * Math.cos(a) * Math.cos(r);
    return 2 * e * Math.atan2(Math.sqrt(u), Math.sqrt(1 - u))
};

FileReader = function () {
};
FileReader.prototype.readAsText = function (file) {
    var parts = file.path.split("/"), result, evt;
    result = JSON.stringify(testData[parts[2] - 1]);
    if (result) {
        evt = {
            target: {
                result: result
            }
        };
        this.onloadend && this.onloadend(evt);
    } else {
        this.onerror && this.onerror();
    }
};

describe("bundlesService", function () {
    var leafletService,
        navService,
        storageService,
        userPreferencesService,
        bundlesService,
        fileSystem,
        mockRootScope = {},
        configPlainBrowser = {
            serviceUrl: "http://foo.bar.baz",
            isPlainBrowser: function () {
                return true;
            },
            testData: testDataIds,
            connectionType: function () {
                return Connection.UNKNOWN;
            }
        },
        configDevice = {
            serviceUrl: "http://foo.bar.baz",
            isPlainBrowser: function () {
                return false;
            },
            testData: testDataIds,
            connectionType: function () {
                return Connection.UNKNOWN;
            }
        },
        safeApply = function ($scope, fn) {
            fn && fn();
        };

    userPreferencesService = {
        allowCellUse: function () {
            return false;
        }
    };

    beforeEach(function (done) {
        fileSystem = (function () {
            var file = {};
            var entry = {
                file: function (onSuccess, onError) {
                    onSuccess(file);
                }
            };
            return {
                root: {
                    fullPath: "",
                    getDirectory: function (dir, flags, onSuccess, onError) {
                        onSuccess();
                    },
                    getFile: function (path, flags, onSuccess, onError) {
                        file.path = path;
                        onSuccess(entry);
                    }
                }
            }
        })();

        context.requestFileSystem = function (type, size, successCallback, errorCallback) {
            successCallback(fileSystem);
        };
        storageService = (function () {
            var db = {};
            return {
                setItem: function (name, value) {
                    db[name] = value;
                },
                getItem: function (name) {
                    return db[name];
                }
            }
        })();
        sinon.spy(storageService, "getItem");
        mockRootScope.$apply = function (cb) {
            cb && cb();
        };

        done();
    });

    var assertItem = function (match, item) {
        match.should.have.property("name").equal(item.name);
        match.should.have.property("description").equal(item.description);
        match.should.have.property("features");
        match.features[0].should.have.property("geometry");
        match.features[0].geometry.should.have.property("coordinates");
        match.features[0].geometry.coordinates[1].should.equal(item.features[0].geometry.coordinates[1]);
        match.features[0].geometry.coordinates[0].should.equal(item.features[0].geometry.coordinates[0]);
    };

    describe("#searchBundlesFromService", function () {
        it("should throw exception because searchCriteria is null", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configPlainBrowser);
            $.ajax = sinon.spy();
            (function () {
                bundlesService.searchBundlesFromService()
            }).should.throw();
            done();
        });
        it("should throw exception because searchCriteria is invalid", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configPlainBrowser);
            $.ajax = sinon.spy();
            (function () {
                bundlesService.searchBundlesFromService({ badProperty: "some bad property" })
            }).should.throw();
            done();
        });
        it("should call bundle URL with properties since all were specified", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configPlainBrowser);
            var callback = sinon.spy();
            $.ajax = callback;
            bundlesService.searchBundlesFromService({sk: "utah", lat: 38.669336, lng: -109.685783});

            var ajaxObj = callback.args[0][0];

            ajaxObj.should.have.property("url").equal("http://foo.bar.baz/bundle");
            ajaxObj.should.have.property("success");
            ajaxObj.should.have.property("error");
            ajaxObj.should.have.property("params");
            ajaxObj.params.should.have.property("sk").equal("utah");
            ajaxObj.params.should.have.property("lng").equal(-109.685783);
            ajaxObj.params.should.have.property("lat").equal(38.669336);
            done();
        });
    });
    describe("#searchBundlesOnDevice", function () {
        it("should return match on first test item with lat/lng from first item in test data", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configDevice);
            var callback = sinon.spy();

            var item = testData[0];
            bundlesService.searchBundlesOnDevice({lat: item.features[0].geometry.coordinates[1], lng: item.features[0].geometry.coordinates[0]}, callback);

            storageService.getItem.getCall(0).args[0].should.equal("geobundles");

            callback.args[0].should.have.lengthOf(1);

            var matches = callback.args[0][0];
            assert(matches.length === 1);
            var match = matches[0];

            assertItem(match, item);
            done();
        });
        it("should return match on both items in Utah in test data since search radius was set large enough", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configDevice);
            var callback = sinon.spy();

            bundlesService.searchBundlesOnDevice({ lat: 38.931272, lng: -109.804230, radius: 200000}, callback);

            storageService.getItem.getCall(0).args[0].should.equal("geobundles");

            var matches = callback.args[0][0];
            matches.should.have.lengthOf(3);

            assertItem(matches[0], testData[2]);
            assertItem(matches[1], testData[3]);
            assertItem(matches[2], testData[4]);

            done();
        });
        it("should return match based on search key for 'dino'", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configDevice);
            var callback = sinon.spy();

            bundlesService.searchBundlesOnDevice({sk: "dino"}, callback);

            storageService.getItem.getCall(0).args[0].should.equal("geobundles");

            var matches = callback.args[0][0];
            matches.should.have.lengthOf(1);
            var match = matches[0];

            var item = testData[0];

            assertItem(match, item);
            done();
        });
    });

    describe("#findById", function () {
        it("in device, should return null if cannot be found", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configDevice);
            var successCallback = sinon.spy();
            var errorCallback = sinon.spy();
            bundlesService.findById("foo", successCallback, errorCallback);

            storageService.getItem.getCall(0).args[0].should.equal("geobundles");
            assert(successCallback.notCalled);
            assert(errorCallback.calledOnce);

            done();
        });
        it("in device, should return first element in test data when queried with same id", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configDevice);
            var callback = sinon.spy();

            var item = testData[0];
            bundlesService.findById(item.id, callback);

            storageService.getItem.getCall(0).args[0].should.equal("geobundles");
            assert(callback.called);

            var obj = callback.args[0][0];
            should.exist(obj);

            assertItem(obj, item);
            done();
        });
        it("in browser, should call remote service with id", function (done) {
            bundlesService = target.bundlesService(mockRootScope, context, leafletService, navService, storageService,
                userPreferencesService, safeApply, configPlainBrowser);
            var callback = sinon.spy();
            $.ajax = callback;
            bundlesService.findById("foo", callback);

            var ajaxObj = callback.args[0][0];

            ajaxObj.should.have.property("url").equal("http://foo.bar.baz/bundle/foo");
            ajaxObj.should.have.property("success");
            ajaxObj.should.have.property("error");
            ajaxObj.should.not.have.property("params");

            done();
        });
    });


});