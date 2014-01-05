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

myAppServices.value('version', '0.1');

var KAIDAD_APP_CONFIG = {
    base: 'us',
    baseDatabase: "base-us.mbtiles",
    //In order to run on the device and connect to local Node.js server,
    //it must have an IP Address rather than 'localhost'
    //Change this to your IP Address!!
    serviceUrl: 'http://localhost:3000',
    bundlesLocalPath: "/kaidad/bundles",
    isPlainBrowser: function () {
        return !$.os.phone && !$.os.tablet;
    },

    //TODO: the following are for testing only - remove before going live!!!
    testData: TEST_DATA_META,
    verboseErrors: true
};

myAppServices.factory('configService', function (phonegapReady) {
    KAIDAD_APP_CONFIG.connectionType = phonegapReady(function () {
        return navigator.connection ? navigator.connection.type : "wifi";
    });
    return KAIDAD_APP_CONFIG;
});

myAppServices.factory('userPreferencesService', function (storageService) {
    var PREFS = {
        ALLOW_CELL_USE: "allowCellUse"
    };

    function get(pref) {
        return storageService.getItem(pref);
    }

    function set(prefKey, prefValue) {
        storageService.setItem(prefKey, prefValue);
    }

    set(PREFS.ALLOW_CELL_USE, true);
    return {
        allowCellUse: function () {
            return get(PREFS.ALLOW_CELL_USE);
        },
        setAllowCellUse: function (allow) {
            set(PREFS.ALLOW_CELL_USE, !!allow);
        }
    };
});

myAppServices.factory('safeApply', function () {
    return function ($scope, fn) {
        var phase = $scope.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                $scope.$eval(fn);
            }
        } else {
            if (fn && (typeof(fn) === 'function')) {
                $scope.$apply(fn);
            } else {
                $scope.$apply();
            }
        }
    }
});

// phonegap ready service - listens to deviceready
myAppServices.factory('phonegapReady', function () {
    return function (fn) {
        var queue = [];
        var impl = function () {
            queue.push(Array.prototype.slice.call(arguments));
        };

        var readyFunc = function () {
            queue.forEach(function (args) {
                fn.apply(this, args);
            });
            impl = fn;
        };

        if (KAIDAD_APP_CONFIG.isPlainBrowser()) {
            $().ready(readyFunc);
        } else {
            document.addEventListener('deviceready', readyFunc, false);
        }

        return function () {
            return impl.apply(this, arguments);
        };
    };
});

myAppServices.factory('accelerometer', function ($rootScope, phonegapReady) {
    return {
        getCurrentAcceleration: phonegapReady(function (onSuccess, onError) {
            navigator.accelerometer.getCurrentAcceleration(function () {
                var that = this,
                    args = arguments;

                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                    args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            });
        })
    };
});

myAppServices.factory('notification', function ($rootScope, phonegapReady) {
    return {
        alert: phonegapReady(function (message, alertCallback, title, buttonName) {
            console.log('alerting now, message: ' + message);
            if (typeof navigator.notification === "undefined") {
                alert(message);
            } else {
                navigator.notification.alert(message, function () {
                    var that = this,
                        args = arguments;

                    if (alertCallback) {
                        $rootScope.$apply(function () {
                            alertCallback.apply(that, args);
                        });
                    }
                }, title, buttonName);
            }
        }),
        confirm: phonegapReady(function (message, confirmCallback, title, buttonLabels) {
            if (typeof navigator.notification === "undefined") {
                alert(message);
            } else {
                navigator.notification.confirm(message, function () {
                    var that = this,
                        args = arguments;

                    $rootScope.$apply(function () {
                        confirmCallback.apply(that, args);
                    });
                }, title, buttonLabels);
            }
        }),
        beep: function (times) {
            if (typeof navigator.notification === "undefined") {
                alert("beep!");
            } else {
                navigator.notification.beep(times);
            }
        },
        vibrate: function (milliseconds) {
            if (typeof navigator.notification === "undefined") {
                alert("buzzzzz!");
            } else {
                navigator.notification.vibrate(milliseconds);
            }
        }
    };
});

myAppServices.factory('navService', function ($rootScope, $navigate, $route, $location, safeApply) {
    return {
        slidePage: function (path, type) {
            console.log("slidePage: path: " + path + ", backStack: " + JSON.stringify($rootScope.backStack) + ", forwardStack:" + JSON.stringify($rootScope.forwardStack));
            $rootScope.forwardStack = [];
            if (!$rootScope.backStack) {
                $rootScope.backStack = [];
            }
            if (!$rootScope.currentPage) {
                $rootScope.currentPage = { path: "/", type: "" };
            }
            $rootScope.backStack.push($rootScope.currentPage);
            $rootScope.currentPage = { path: path, type: type };
            $navigate.go(path, type);
            safeApply($rootScope);
        },
        navBack: function () {
            if ($rootScope.backStack && $rootScope.backStack.length > 0) {
                console.log("navBack: backStack: " + JSON.stringify($rootScope.backStack) + ", forwardStack:" + JSON.stringify($rootScope.forwardStack));
                if (!$rootScope.forwardStack) {
                    $rootScope.forwardStack = [];
                }
                $rootScope.forwardStack.push($rootScope.currentPage);
                $rootScope.currentPage = $rootScope.backStack.pop();
                $navigate.go($rootScope.currentPage.path, $rootScope.currentPage.type);
                safeApply($rootScope);
            } else {
                $navigate.go("/");
            }
        },
        navForward: function () {
            if ($rootScope.forwardStack && $rootScope.forwardStack.length > 0) {
                console.log("navForward: backStack: " + JSON.stringify($rootScope.backStack) + ", forwardStack:" + JSON.stringify($rootScope.forwardStack));
                if (!$rootScope.backStack) {
                    $rootScope.backStack = [];
                }
                $rootScope.backStack.push($rootScope.currentPage);
                $rootScope.currentPage = $rootScope.forwardStack.pop();
                $navigate.go($rootScope.currentPage.path, $rootScope.currentPage.type);
                safeApply($rootScope);
            }
        },
        navToNewMap: function (mapDatabase) {
            console.log("navToNewMap: backStack: " + JSON.stringify($rootScope.backStack) + ", forwardStack:" + JSON.stringify($rootScope.forwardStack));
            $rootScope.forwardStack = [];
            if (!$rootScope.backStack) {
                $rootScope.backStack = [];
            }
            $rootScope.backStack.push($rootScope.currentPage);
            $rootScope.currentPage = { path: "/mapView/" + mapDatabase, type: "" };
            $navigate.go($rootScope.currentPage.path, $rootScope.currentPage.type);
            safeApply($rootScope);
        }
    }
});

myAppServices.factory('storageService', function ($rootScope) {
    return {
        setItem: function (key, value) {
            if (window.localStorage) {
                window.localStorage.setItem(key, value);
            } else {
                if ($rootScope.dataStore === null || typeof $rootScope.dataStore === "undefined") {
                    $rootScope.dataStore = {};
                }
                $rootScope.dataStore[key] = value;
            }
        },
        getItem: function (key) {
            if (window.localStorage) {
                return window.localStorage.getItem(key);
            } else {
                if ($rootScope.dataStore) {
                    return $rootScope.dataStore[key];
                } else {
                    return null;
                }
            }
        }
    }
});

myAppServices.factory('compass', function ($rootScope, phonegapReady) {
    return {
        getCurrentHeading: phonegapReady(function (onSuccess, onError) {
            navigator.compass.getCurrentHeading(function () {
                var that = this,
                    args = arguments;

                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                    args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            });
        })
    };
});

myAppServices.factory('contacts', function ($rootScope, phonegapReady) {
    return {
        findContacts: phonegapReady(function (onSuccess, onError) {
            var options = new ContactFindOptions();
            options.filter = "";
            options.multiple = true;
            var fields = ["displayName", "name"];
            navigator.contacts.find(fields, function (r) {
                var that = this,
                    args = arguments;
                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                    args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            }, options)
        })
    }
});

myAppServices.factory('currentLocationService', function ($rootScope, phonegapReady, geolocation, safeApply) {
    function clearMarkerWatcher(bag) {
        if (!bag) {
            throw new Error("'bag' must be initialized and valid");
        }
        if (bag.currentLocationMarkerWatcher) {
            console.log("Clearing currentLocationMarkerWatcher");
            geolocation.clearWatch(bag.currentLocationMarkerWatcher);
            delete bag.currentLocationMarkerWatcher;
        }
    }

    function clearCurrentLocationMarker(bag) {
        if (!bag) {
            throw new Error("'bag' must be initialized and valid");
        }
        if (bag.currentLocationMarker) {
            bag.mapScope.leaflet.map.removeLayer(bag.currentLocationMarker);
        }
    }

    function guardBag(bag) {
        if (bag === null || typeof bag === "undefined") {
            throw new Error("'bag' must be initialized and valid");
        }
    }

    function clearCenterWatcher(bag) {
        guardBag(bag);
        if (bag.currentLocationCenterWatcher) {
            console.log("Clearing currentLocationCenterWatcher");
            geolocation.clearWatch(bag.currentLocationCenterWatcher);
            delete bag.currentLocationCenterWatcher;
        }
    }

    return {
        startMarkingLocation: phonegapReady(function ($scope, bag, onSuccess, onError) {
            guardBag(bag);
            clearMarkerWatcher(bag);
            var locationHolder = locationUtils.locationHolder();
            bag.currentLocationMarkerWatcher = geolocation.watchPosition(function (position) {
                if (locationHolder.isEqualToLastLocation(position)) {
                    return;
                }
                console.log("Creating marker in new position " + JSON.stringify(position));

                clearCurrentLocationMarker(bag);
                var marker = L.userMarker({lat: position.coords.latitude, lng: position.coords.longitude},
                    {pulsing: true, accuracy: (position.coords.accuracy || 100), smallIcon: true, zIndexOffset: 1000});
                marker.addTo(bag.mapScope.leaflet.map);
                bag.currentLocationMarker = marker;

                onSuccess && onSuccess();
            }, function (err) {
                angular.extend($scope, {
                    marker: undefined
                });
                safeApply($scope);
                console.log("Error watching position: " + JSON.stringify(err));
                onError && onError(err);
            });
        }),
        stopMarkingLocation: phonegapReady(function (bag) {
            clearMarkerWatcher(bag);
            clearCurrentLocationMarker(bag);
        }),
        setCenter: phonegapReady(function ($scope, bag, onSuccess, onError) {
            guardBag(bag);
            geolocation.getCurrentPosition(function (position) {
                angular.extend($scope, {
                    center: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        zoom: bag.mapMetadata.maxzoom
                    }
                });
                safeApply($scope);
                onSuccess && onSuccess();
            }, function (err) {
                console.log("Error watching position: " + JSON.stringify(err));
                onError && onError(err);
            });
        }),
        startCentering: phonegapReady(function ($scope, bag, onSuccess, onError) {
            guardBag(bag);
            clearCenterWatcher(bag);
            var locationHolder = locationUtils.locationHolder();
            bag.currentLocationCenterWatcher = geolocation.watchPosition(function (position) {
                if (locationHolder.isEqualToLastLocation(position)) {
                    return;
                }

                console.log("Centering to new position " + JSON.stringify(position));
                angular.extend($scope, {
                    center: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        zoom: bag.mapMetadata.maxzoom
                    }
                });
                safeApply($scope);

                bag.mapScope.leaflet.map.on("dragend", function () {
                    clearCenterWatcher(bag);
                });

                bag.mapScope.leaflet.map.on("zoomend", function () {
                    clearCenterWatcher(bag);
                });

                onSuccess && onSuccess();
            }, function (err) {
                console.log("Error watching position: " + JSON.stringify(err));
                onError && onError(err);
            });
        }),
        stopCentering: phonegapReady(function (bag) {
            guardBag(bag);
            var watcher = bag.currentLocationCenterWatcher;
            watcher && (geolocation.clearWatch(watcher));
        }),
        followCurrentLocationIfInMapBounds: phonegapReady(function ($scope, bag, onSuccess, onError) {
            guardBag(bag);
            var that = this;

            geolocation.getCurrentPosition(function (position) {
                //"-172.9688,-3.6011,-21.9727,72.101"
                var curLat = position.coords.latitude;
                var curLng = position.coords.longitude;
                var bounds = bag.mapScope.maxBounds;
                if (!(curLng >= bounds.southWest.lng && curLng <= bounds.northEast.lng &&
                    curLat >= bounds.southWest.lat && curLat <= bounds.northEast.lat)) {
                    console.log("disabling nav to location because current location is outside bounds of current map");
                    $rootScope.disableNavToLocation = true;
                    onSuccess && onSuccess();
                    return;
                }
                $rootScope.disableNavToLocation = false;

                angular.extend($scope, {
                    center: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        zoom: bag.mapMetadata.maxzoom
                    }
                });

                that.startCentering($scope, bag, function () {
                    console.log("Done updating center");
                }, function (err) {
                    console.log("Error occurred centering map: " + JSON.stringify(err));
                });

                that.startMarkingLocation($scope, bag, function () {
                    console.log("Done marking current location...");
                }, function (err) {
                    console.log("Error occurred adding marker for current location: " + JSON.stringify(err));
                });


                onSuccess && onSuccess();
            }, function (err) {
                onError && onError(err);
            });
        })
    }
});

myAppServices.factory('leafletService', function () {
    var defaults = {
        maxZoom: 14,
        minZoom: 1,
        tileLayer: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        tileLayerOptions: {
            attribution: 'Tiles &copy; Open Street Maps'
        },
        icon: {
            url: '../img/marker-icon.png',
            retinaUrl: '../img/marker-icon@2x.png',
            size: [25, 41],
            anchor: [12, 40],
            popup: [0, -40],
            shadow: {
                url: '../img/marker-shadow.png',
                retinaUrl: '../img/marker-shadow.png',
                size: [41, 41],
                anchor: [12, 40]
            }
        },
        path: {
            weight: 10,
            opacity: 1,
            color: '#0000ff'
        }
    };


    function buildIcon() {
        return L.divIcon({
            className: "",
            iconSize: [25, 41],
            iconAnchor: [12, 40],
            popupAnchor: [0, -40],
            labelAnchor: [0, -40],
            html: '<div><i class="kaidad-map-marker"></i><i class="kaidad-map-marker-shadow"></i></div>'
        });
    }

    return {
        buildMarker: function (data) {
            var micon = null;
            if (data.icon) {
                micon = data.icon;
            } else {
                micon = buildIcon();
            }
            var options = {
                icon: micon,
                draggable: data.draggable ? true : false,
                clickable: data.clickable ? true : false,
                keyboard: data.keyboard ? true : false
            };
            data.title && (options.title = data.title);
            data.zIndexOffset && (options.zIndexOffset = data.zIndexOffset);
            data.opacity && (options.opacity = data.opacity);
            if (data.riseOnHover) {
                options.riseOnHover = true;
                options.riseOffset = (data.riseOffset ? data.riseOffset : 250);
            }

            return L.marker(data, options);
        }
    }

});





