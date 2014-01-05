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

var should = require("should");
var assert = require("assert");
var target = require("../geo/assets/www/js/location-utilities.js").locationUtils;
var sinon = require("sinon");


describe("locationUtils", function () {

    describe("#distanceBetween", function () {
        it("should equal zero - it's the same point", function (done) {
            var loc1 = { coords: { latitude: 32.440150, longitude: -110.788193 } };
            assert.equal(0, target.distanceBetween(loc1, loc1));
            done();
        });
        it("should not equal zero - different points - exact amount is a big decimal", function (done) {
            var loc1 = { coords: { latitude: 33.331240, longitude: -111.735640 } };
            var loc2 = { coords: { latitude: 33.331092, longitude: -111.735383 } };
            assert.equal(0.11131949051221887, target.distanceBetween(loc1, loc2));
            done();
        });
    });
    describe("#isEqual", function () {
        it("should be true - it's the same point", function (done) {
            var loc1 = { coords: { latitude: 32.440150, longitude: -110.788193 } };
            assert.equal(true, target.isEqual(loc1, loc1));
            done();
        });
        it("should be false - different points with difference exceeding threshold", function (done) {
            var loc1 = { coords: { latitude: 32.440100, longitude: -110.788193 } };
            var loc2 = { coords: { latitude: 32.440190, longitude: -110.788193 } };
            assert.equal(false, target.isEqual(loc1, loc2, 10.0));
            done();
        });
    });
    describe("#isWithinRadius", function () {
        it("should be true - it's the same point", function (done) {
            var loc1 = { coords: { latitude: 32.440150, longitude: -110.788193 } };
            assert.equal(true, target.isWithinRadius(loc1, loc1, 0.1));
            done();
        });
        it("should be false - different points with difference exceeding threshold", function (done) {
            var loc1 = { coords: { latitude: 32.440100, longitude: -110.788193 } };
            var loc2 = { coords: { latitude: 32.440190, longitude: -110.788193 } };
            assert.equal(false, target.isWithinRadius(loc1, loc2, 10.0));
            done();
        });
    });
    describe("#locationHolder", function () {
        it("isEqualToLastPosition should be true when the same point is used", function (done) {
            var loc1 = { coords: { latitude: 32.440150, longitude: -110.788193 } };
            var locHolder = target.locationHolder(loc1);
            for (var i = 0; i < 10; i++) {
                assert.equal(true, locHolder.isEqualToLastLocation(loc1));
            }
            done();
        });
        it("isEqualToLastPosition should be false when point increments beyond threshold", function (done) {
            var loc1 = { coords: { latitude: 32.440150, longitude: -110.788193 } };
            var locHolder = target.locationHolder(loc1);
            for (var i = 0; i < 10; i++) {
                loc1.coords.latitude += 1;
                assert.equal(false, locHolder.isEqualToLastLocation(loc1));
            }
            done();
        });
        it("isEqualToLastPosition with NO initial location, should be false when point increments beyond threshold", function (done) {
            var loc1 = { coords: { latitude: 32.440150, longitude: -110.788193 } };
            var locHolder = target.locationHolder();
            for (var i = 0; i < 10; i++) {
                loc1.coords.latitude += 1;
                assert.equal(false, locHolder.isEqualToLastLocation(loc1));
            }
            done();
        });
        it("isEqualToLastPosition with NO initial location, should be false when point increments beyond threshold", function (done) {
            var loc1 = { coords: { latitude: 32.440150, longitude: -110.788193 } };
            var locHolder = target.locationHolder();
            //first it should return false because there is no existing position
            assert.equal(false, locHolder.isEqualToLastLocation(loc1));
            assert.equal(true, locHolder.isEqualToLastLocation(loc1));
            loc1.coords.latitude += 0.0001; //about 11 meters - threshold is 20
            assert.equal(true, locHolder.isEqualToLastLocation(loc1));
            loc1.coords.latitude += 0.0001; //another 11 meters and it is now larger than threshold
            assert.equal(false, locHolder.isEqualToLastLocation(loc1));
            done();
        });
    });

});