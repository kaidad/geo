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

'use strict';

myAppServices.factory('geolocation', function ($rootScope, $timeout, phonegapReady, safeApply) {
    var defaultOptions = {maximumAge: 30000, timeout: 5000, enableHighAccuracy: true}, currentWatchId = 0;

    function getCurrentPosition(onSuccess, onError, options) {
        (phonegapReady(function () {
            if (navigator.geolocation) {

                options || (options = defaultOptions);
                navigator.geolocation.getCurrentPosition(function () {
                        console.log('geolocation::getCurrentPosition - current position: ' + JSON.stringify(arguments));
                        var that = this,
                            args = arguments;

                        if (onSuccess) {
                            safeApply($rootScope, function () {
                                onSuccess.apply(that, args);
                            });
                        }
                    }, function () {
                        var that = this,
                            args = arguments;

                        if (onError) {
                            safeApply($rootScope, function () {
                                onError.apply(that, args);
                            });
                        }
                    },
                    options);
            } else {
                onError("Location services not supported - please enable location services and try again");
            }
        }))();
    }

    function updateCurrentLocation() {
        function successCb(position) {
            $rootScope.locationHolder.currentLocation = position;
            $rootScope.locationHolder.lastKnownLocation = position;
            $rootScope.locationHolder.watchers.forEach(function (watcher) {
                if (!watcher.internalWatchId) {
                    watcher.watchPosition();
                }
            });
            console.log('geolocation::watchForLocation - successfully obtained current position: ' + JSON.stringify(position));
        }

        function errorCb(e) {
            console.log('geolocation::watchForLocation - error in callback: ' + JSON.stringify(e), e);
            $rootScope.locationHolder.currentLocation && delete $rootScope.locationHolder.currentLocation;
        }

        try {
            getCurrentPosition(successCb, errorCb, defaultOptions);
        } catch (e) {
            console.log('geolocation::watchForLocation - caught exception: ' + JSON.stringify(e), e);
            $rootScope.locationHolder.currentLocation && delete $rootScope.locationHolder.currentLocation;
        }
        watchForLocation();
    }

    $rootScope.locationHolder = {
        watchers: []
    };

    var watchForLocation = function () {
        $timeout(updateCurrentLocation, defaultOptions.timeout);
    };

    function watchPosition(onSuccess, onError, options) {
        return (phonegapReady(function () {
            if (navigator.geolocation) {
                options || (options = defaultOptions);
                var watchId = navigator.geolocation.watchPosition(function () {
                        var that = this,
                            args = arguments;

                        if (onSuccess) {
                            safeApply($rootScope, function () {
                                onSuccess.apply(that, args);
                            });
                        }
                    }, function () {
                        var that = this,
                            args = arguments;

                        if (onError) {
                            safeApply($rootScope, function () {
                                onError.apply(that, args);
                            });
                        }
                    },
                    options);
                console.log("watchPosition: watchID: " + watchId);
                return watchId;
            } else {
                onError("Location services not supported - please enable location services and try again");
            }
        }))();
    }

    var positionWatcher = function (onSuccess, onError, options) {
        var watcher = {
            watchId: currentWatchId++,
            internalWatchId: undefined,
            watchPosition: function () {
                this.internalWatchId = watchPosition(onSuccess, onError, options);
            }
        };
        watcher.watchPosition();
        $rootScope.locationHolder.watchers.push(watcher);
        return watcher;
    };

    function clearWatch(watcher) {
        var watchers = $rootScope.locationHolder.watchers;
        var idx = watchers.indexOf(watcher);
        if (idx >= 0) {
            watchers.splice(idx, 1);
        }

        if (watcher.internalWatchId && navigator.geolocation) {
            console.log("clearWatch: watchID: " + watcher.internalWatchId);
            return navigator.geolocation.clearWatch(watcher.internalWatchId);
        } else {
            return null;
        }
    }

    watchForLocation();

    return {
        getCurrentPosition: getCurrentPosition,
        watchPosition: positionWatcher,
        clearWatch: clearWatch
    };
});
