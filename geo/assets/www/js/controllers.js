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

/* Controllers */
function HomeCtrl($scope, navService, $rootScope, currentLocationService, notification, safeApply, configService) {
    //this flag will be flipped to true if location is not available or not in bounds of current map
    $rootScope.disableNavToLocation = true;
    $rootScope.showSettings = false;
    $rootScope.showFeatureProximityAlert = false;
    $rootScope.showFeatureDetail = false;

    //these flags are used to disable the back/forward buttons
    $rootScope.backHistoryEmpty = !!(!$rootScope.backStack || $rootScope.backStack.length == 0);
    $rootScope.forwardHistoryEmpty = !!(!$rootScope.forwardStack || $rootScope.forwardStack.length == 0);

    $rootScope.slidePage = function (path, type) {
        navService.slidePage(path, type);
    };
    $scope.back = function () {
        navService.navBack();
    };
    $scope.navBack = function () {
        navService.navBack();
    };
    $scope.navForward = function () {
        navService.navForward();
    };
    $scope.changeSettings = function () {
        console.log("showing settings");
        $rootScope.showSettings = true;
        safeApply($rootScope);
    };
    $scope.closeOverlay = function () {
        console.log("hiding settings");
        $rootScope.showSettings = false;
    };
    $scope.followCurrentLocationIfInMapBounds = function () {
        var bag = $rootScope.currentMapBag,
            mapScope;
        if (!bag) {
            return; //no map to center on...
        }
        mapScope = bag.mapScope;
        if (mapScope) {
            console.log("recentering and following current location");
            currentLocationService.followCurrentLocationIfInMapBounds(mapScope, bag, function () {
                console.log("Done setting center");
            }, function (err) {
                notification.alert("Could not determine the current location - make sure you have the GPS turned " +
                    "on to experience the field trip in real time!")
                console.log("Error occurred getting current location: " + JSON.stringify(err));
            });
        }
    };
}

function ContactCtrl($scope, navService) {
    $scope.submitFeedback = function () {
        console.log("Got feedback from: " + $scope.contactSubmit.email + ": " + $scope.contactSubmit.comment);
        navService.navBack();
    }
}

function CreateFieldGuideCtrl($scope, navService, bundlesService) {
    $scope.createFieldGuide = function () {
        console.log("Creating field guide: " + $scope.fieldGuide.title);
        bundlesService.create($scope.fieldGuide, function () {
            navService.navBack();
        }, function (err) {
            $scope.$error.message = err.message || "Error while trying to create field guide - check input and try again";
        })

    }
}

function NotificationCtrl($scope) {
    $scope.alertNotify = function () {
        navigator.notification.alert("Sample Alert", function () {
            console.log("Alert success")
        }, "My Alert", "Close");
    };

    $scope.beepNotify = function () {
        navigator.notification.beep(1);
    };

    $scope.vibrateNotify = function () {
        navigator.notification.vibrate(3000);
    };

    $scope.confirmNotify = function () {
        navigator.notification.confirm("My Confirmation", function () {
            console.log("Confirm Success")
        }, "Are you sure?", ["Ok", "Cancel"]);
    };
}

function GeolocationCtrl($scope, navService, safeApply) {
    navigator.geolocation.getCurrentPosition(function (position) {
        $scope.position = position;
        safeApply($scope);
    }, function (e) {
        console.log("Error retrieving position " + e.code + " " + e.message)
    }, { maximumAge: 300000, timeout: 10000, enableHighAccuracy: true });

    $scope.back = function () {
        navService.back();
    };
}

function AccelerCtrl($scope) {
    navigator.accelerometer.getCurrentAcceleration(function (acceleration) {
        $scope.acceleration = acceleration;
    }, function (e) {
        console.log("Error finding acceleration " + e)
    });
}

function DeviceCtrl($scope) {
    console.log("DeviceCtrl controller: " + device);
    $scope.device = device;
}

function CompassCtrl($scope, safeApply) {
    navigator.compass.getCurrentHeading(function (heading) {
        $scope.heading = heading;
        safeApply($scope);
    }, function (e) {
        console.log("Error finding compass " + e.code)
    });
}

function ContactsCtrl($scope, safeApply) {
    $scope.find = function () {
        $scope.contacts = [];
        var options = new ContactFindOptions();
        //options.filter=""; //returns all results
        options.filter = $scope.searchTxt;
        options.multiple = true;
        var fields = ["displayName", "name", "phoneNumbers"];
        navigator.contacts.find(fields, function (contacts) {
            $scope.contacts = contacts;
            safeApply($scope);
        }, function (e) {
            console.log("Error finding contacts " + e.code)
        }, options);
    }
}

function CameraCtrl($scope, safeApply) {
    $scope.takePic = function () {
        var options = {
            quality: 50,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: 1, // 0:Photo Library, 1=Camera, 2=Saved Photo Album
            encodingType: 0     // 0=JPG 1=PNG
        };
        // Take picture using device camera and retrieve image as base64-encoded string
        navigator.camera.getPicture(onSuccess, onFail, options);
    };
    var onSuccess = function (imageData) {
        console.log("On Success! ");
        $scope.picData = "data:image/jpeg;base64," + imageData;
        safeApply($scope);
    };
    var onFail = function (e) {
        console.log("On fail " + e);
    };
}

function MapCtrl($rootScope, $scope, $routeParams, $q, phonegapReady, notification, mapService, currentLocationService, safeApply, bundlesService, configService, storageService, featureViewerService, navService) {
    console.log("MapCtrl controller: ");
    //show busy spins a spinner where the configuration gear usually goes
    $rootScope.showBusy = true;
    $rootScope.headerMessage = "Loading map...";

    if (!$scope.mapBag) {
        $scope.mapBag = {};
    }

    $rootScope.currentMapBag = $scope.mapBag;
    var bag = $scope.mapBag;
    bag.mapScope = $scope;

    var d = $q.defer();
    bag.dbLoadedPromise = d.promise;

    function loadDb(database) {
        console.log("Loading db [" + database + "]");

        function broadcastViewEvents() {
            var featureToShow = $rootScope.featureToShow;
            if (featureToShow) {
                $rootScope.$broadcast('locationProximityEvent-closeFeatureOverlay-' + featureToShow.bundleId + '-' + featureToShow.feature.id);
                delete $rootScope.featureToShow;
            }

            var dbToShowDetailOn = $scope.featureViewer.featuresToViewStack &&
                $scope.featureViewer.featuresToViewStack.length > 0 &&
                $scope.featureViewer.featuresToViewStack[0].feature.properties.detailMapDatabase;
            if (!dbToShowDetailOn) {
                dbToShowDetailOn = configService.baseDatabase;
            }
            if (dbToShowDetailOn !== database) {
                navService.slidePage('/mapView/' + dbToShowDetailOn);
            } else {
                console.log('MapCtrl - caught locationProximityEvent - showing feature proximity alert');
                featureViewerService.broadcastViewEvents($scope);
            }
            safeApply($scope);
        }

        $scope.$on('locationProximityEvent', broadcastViewEvents);

        function resolve() {
            console.log("MapCtrl: resolving promise");
            d.resolve();
            $rootScope.showBusy = false;
            $rootScope.headerMessage = undefined;
            safeApply($rootScope);
        }

        function errorHandler(err) {
            console.log("Error while querying map metadata: " + JSON.stringify(err));
            notification.alert("Error loading base map!" + (configService.verboseErrors ? JSON.stringify(err) : ""));
            resolve();
        }

        function processMapDb(mapDb) {
            bag.mapDb = mapDb;
            mapDb.getMetadata(function (metadata, mapData) {
                console.log("Metadata: " + JSON.stringify(metadata) + ", mapData: " + JSON.stringify(mapData));

                bag.mapMetadata = metadata;

                angular.extend($scope, mapData);

                $scope.$on("$destroy", function () {
                    console.log("Clearing location and center watches");
                    currentLocationService.stopMarkingLocation(bag);
                    currentLocationService.stopCentering(bag);
                });

                //bundles load asynchronously once the map is loaded
                bundlesService.loadBundles($scope, bag, function () {
                    featureViewerService.addFeatureToView($scope, $routeParams.bundleId, $routeParams.featureId);
                    featureViewerService.broadcastViewEvents($scope);
                    safeApply($scope);
                });

                $scope.$on("mapLoaded", function () {
                    currentLocationService.followCurrentLocationIfInMapBounds($scope, bag, function () {
                        console.log("Done setting center");
                    }, function (err) {
                        var hasSeenLocAlert = storageService.getItem("hasSeenLocAlert");
                        if (!hasSeenLocAlert) {
                            notification.alert("Could not determine the current location - make sure you have the GPS turned " +
                                "on to experience the field trip in real time!");
                            storageService.setItem("hasSeenLocAlert", true);
                        }
                        console.log("Error occurred getting current location: " + JSON.stringify(err));
                        resolve();
                    });
                });

                resolve();

            }, errorHandler);

        }

        mapService.loadDb(database, processMapDb, errorHandler);
    }

    phonegapReady(function () {
        var database = $routeParams.mapDb;
        if (!database || database === "root") {
            //load base map
            database = configService.baseDatabase;
        }

        console.log('MapCtrl::loading mapDb: ' + database);
        loadDb(database);
    })();
}

function ListBundlesCtrl($rootScope, $scope, bundlesService, notification, configService) {
    function updateModel() {
        bundlesService.getBundlesMetadata(function (bundlesMetadata) {
            var clonedBundles = {};
            angular.extend(clonedBundles, bundlesMetadata);
            console.log('bundles: ' + JSON.stringify(clonedBundles));
            $scope.bundles = clonedBundles;
            $rootScope.showBusy = false;
            delete $rootScope.headerMessage
        }, function (err) {
            $rootScope.showBusy = false;
            console.log('Unable to load all bundles: ' + JSON.stringify(err), err);
        })
    }


    $scope.reloadBundle = function (bundle) {
        function reloadBundle(idx) {
            if (idx === 1) {
                $rootScope.showBusy = true;
                $rootScope.headerMessage = "Reloading Field Guide...";
                bundlesService.reloadBundle(bundle.id, updateModel);
            }
        }

        notification.confirm("This will reload the Field Guide. Internet connectivity is required - continue?",
            reloadBundle, "Reload Bundle", "Reload,Cancel");
    };

    $scope.removeBundle = function (bundle) {
        function removeBundle(idx) {
            if (idx === 1) {
                $rootScope.showBusy = true;
                $rootScope.headerMessage = "Removing Field Guide...";
                bundlesService.removeBundleFromDevice(bundle.id, updateModel);
            }
        }

        notification.confirm("This will remove the Field Guide from the device. You can reload later, but reloading requires internet connectivity - continue?",
            removeBundle, "Reload Bundle", "Remove,Cancel");
    };

    $scope.isPlainBrowser = configService.isPlainBrowser();
    updateModel();
}

function BundleDetailCtrl($scope, $routeParams, notification, bundlesService, safeApply) {
    if (!$routeParams.bundleId) {
        notification.alert("Cannot show details - no ID was passed.");
    }

    //snap does funny things with our scrollers - turn it off
    $scope.$parent.myScrollOptions = {
        'wrapper': {
            snap: false
        }
    };

    bundlesService.findById($routeParams.bundleId, function (bundle) {
        console.log('BundleDetailCtrl::bundle: ' + JSON.stringify(bundle));
        $scope.bundle = bundle;
        safeApply($scope);
    }, function (err) {
        console.log('Unable to find bundle: ' + $routeParams.bundleId);
    });

}

function FeatureProximityAlertCtrl($rootScope, $scope) {
    $scope.closeOverlay = function () {
        $rootScope.showFeatureProximityAlert = false;
    };

    $scope.$on('locationProximityEvent', function () {
        console.log('Caught locationProximityEvent - showing feature proximity alert');
        $rootScope.showFeatureProximityAlert = true;
    });
}

function FeatureDetailCtrl($rootScope, $scope, safeApply) {
    $scope.closeOverlay = function (eventToEmit) {
        console.log("hiding feature details");
        $rootScope.showFeatureDetail = false;
        $rootScope.$broadcast(eventToEmit);
        $scope.narrationAudio && $scope.narrationAudio.pause();
        delete $scope.narrationAudioPlaylist;
        delete $rootScope.featureToShow;
        safeApply($rootScope);
    };

    $scope.playPause = function () {
        $scope.narrationAudio && $scope.narrationAudio.playPause();
    };

    $scope.toggleMute = function () {
        $scope.narrationAudio && ($scope.narrationAudio.toggleMute());
    };

    $scope.$watch('narrationAudio.playing', function(playing) {
        if (!playing &&
            //only auto-close if set to autoplay
            ($scope.featureToShow && $scope.featureToShow.feature.properties.autoplay) &&
            //only close if this wasn't a user-initiated pause
            ($scope.narrationAudio && $scope.narrationAudio.formatTime === $scope.narrationAudio.formatDuration)) {
            $scope.closeOverlay($scope.eventToEmit);
        }
    });

    //snap does funny things with our scrollers - turn it off
    $scope.$parent.myScrollOptions = {
        'wrapper': {
            snap: false
        }
    };

    $scope.$watch('featureToShow', function (featureToShow) {
        if (!featureToShow) return;
        if (featureToShow.feature.properties.narration) {
            $scope.narrationAudioPlaylist = [
                { src: featureToShow.feature.properties.narration, type: 'audio/mp3' }
            ]
        }
        featureToShow.scroller = {}; //object to trigger scroller
        safeApply($scope);
    });
}

