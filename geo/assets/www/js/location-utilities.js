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

var locationUtils = (function () {
    /**
     * Haversine formula for calculating distance
     *
     * @param position1
     * @param position2
     * @return {Number}
     */
    function distanceBetween(position1, position2) {
        var e = 6378137,
            i = Math.PI / 180,
            n = (position2.coords.latitude - position1.coords.latitude) * i,
            s = (position2.coords.longitude - position1.coords.longitude) * i,
            a = position1.coords.latitude * i,
            r = position2.coords.latitude * i,
            h = Math.sin(n / 2),
            l = Math.sin(s / 2),
            u = h * h + l * l * Math.cos(a) * Math.cos(r);
        return 2 * e * Math.atan2(Math.sqrt(u), Math.sqrt(1 - u))
    }

    return {
        DEFAULT_THRESHOLD: 20,
        DEFAULT_RADIUS: 500,
        distanceBetween: function (position1, position2) {
            if (!position1.coords || !position2.coords ||
                !position1.coords.latitude || !position1.coords.longitude ||
                !position2.coords.latitude || !position2.coords.longitude) {
                throw new Error('expected positions to have coords and latitude and longitude in coords');
            }
            return distanceBetween(position1, position2);
        },
        isWithinRadius: function (position1, position2, radius) {
            var radius = (Number(radius) || this.DEFAULT_RADIUS);
            var distance = this.distanceBetween(position1, position2);
            return distance <= radius;
        },
        isEqual: function (position1, position2, threshold) {
            return this.isWithinRadius(position1, position2, (threshold || this.DEFAULT_THRESHOLD));
        },
        locationHolder: function(initialLocation) {
            var that = this;
            var previousLocation;
            function cloneLoc(loc) {
                if (loc && (!loc.coords ||  !loc.coords.latitude || !loc.coords.longitude)) {
                    throw new Error('expected positions to have coords and latitude and longitude in coords');
                }
                previousLocation = loc ? { coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude } } : undefined;
            }
            cloneLoc(initialLocation);
            return {
                isEqualToLastLocation: function(currentLocation) {
                    if (previousLocation) {
                        var isEqual = that.isEqual(previousLocation, currentLocation);
                        //don't clone it until it's not equal - otherwise if the user is moving slow enough
                        //the position will never get to a point of being unequal - it will appear as though the
                        //user isn't moving when they really are!
                        if (!isEqual) {
                            cloneLoc(currentLocation);
                        }
                        return isEqual;
                    } else {
                        cloneLoc(currentLocation);
                        return false;
                    }
                }
            }
        }
    }
}());

//expose for testing through mocha/node
if (typeof exports !== "undefined") {
    exports.locationUtils = locationUtils;
}