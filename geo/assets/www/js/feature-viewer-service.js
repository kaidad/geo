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

var featureViewerService = function (safeApply, geolocation, bundlesService) {
    var DEFAULT_SEARCH_RADIUS = 100;

    function broadcastAndWaitForClose($scope) {
        var fv = $scope.featureViewer;
        if (!fv || (fv.featuresToViewStack && fv.featuresToViewStack.length === 0)) {
            return;
        }

        fv.inProcessFeature = fv.featuresToViewStack[0];

        $scope.$on('locationProximityEvent-closeFeatureOverlay-' +
            fv.inProcessFeature.bundle.id + '-' + fv.inProcessFeature.feature.id, function () {
            var holder = $scope.featureViewer;
            holder.featuresAlreadyViewedInRadius.push(holder.inProcessFeature);
            var idx = holder.featuresToViewStack.indexOf(holder.inProcessFeature);
            if (idx >= 0) {
                holder.featuresToViewStack.splice(idx, 1);
            }
            delete holder.inProcessFeature;
            broadcastAndWaitForClose($scope);
        });

        $scope.$broadcast('locationProximityEvent-openFeatureOverlay-' +
            fv.inProcessFeature.bundle.id + '-' + fv.inProcessFeature.feature.id);
        safeApply($scope);
    }

    function sortByDistance(currentPosition, matches) {
        matches.sort(function (a, b) {
            var distanceA = locationUtils.distanceBetween(currentPosition,
                {
                    coords: {
                        latitude: a.feature.geometry.coordinates[1],
                        longitude: a.feature.geometry.coordinates[0]
                    }
                }, DEFAULT_SEARCH_RADIUS);
            var distanceB = locationUtils.distanceBetween(currentPosition,
                {
                    coords: {
                        latitude: b.feature.geometry.coordinates[1],
                        longitude: b.feature.geometry.coordinates[0]
                    }
                }, DEFAULT_SEARCH_RADIUS);
            return distanceA - distanceB;
        });
    }

    function indexOfFeature(collection, featureHolder) {
        for (var i = 0; i < collection.length; i++) {
            var elem = collection[i];
            if (Number(elem.bundle.id) === Number(featureHolder.bundle.id) &&
                Number(elem.feature.id) === Number(featureHolder.feature.id)) {
                return i;
            }
        }
        return -1;
    }

    function addIfNotPresent($scope, match) {
        var i = indexOfFeature($scope.featureViewer.featuresToViewStack, match);
        var j = indexOfFeature($scope.featureViewer.featuresAlreadyViewedInRadius, match);
        console.log('featureViewerService::addIfNotPresent: i: ' + i + ', j: ' + j);
        if (i < 0 && j < 0) {
            $scope.featureViewer.featuresToViewStack.push(match);
        }
    }

    function fireViewEventIfNecessary($scope, shouldFireEvent) {
        if (shouldFireEvent) {
            console.log('featureViewerService - firing locationProximityEvent');
            $scope.$broadcast('locationProximityEvent');
            safeApply($scope);
        } else {
            console.log('featureViewerService - NOT firing locationProximityEvent as there were already features to view left in the stack');
        }

    }

    function processFeaturesToView($scope, matches, position) {
        if (matches.length == 0) {
            return;
        }

        //don't fire an event if the featuresToViewStack isn't empty or if a feature is being viewed
        var shouldFireEvent = ($scope.featureViewer.featuresToViewStack === undefined ||
            $scope.featureViewer.featuresToViewStack.length === 0) && !$scope.featureToShow;

        position && matches.length > 1 && sortByDistance(position, matches);

        matches.forEach(function (match) {
            //all the features in the view that haven't been viewed
            addIfNotPresent($scope, match);
        });

        fireViewEventIfNecessary($scope, shouldFireEvent);
    }

    function clearFromCollectionIfNoLongerInView(collection, currentPosition) {
        for (var i = collection.length - 1; i >= 0; i--) {
            var featureHolder = collection[i];
            var featureLoc = {
                coords: {
                    latitude: featureHolder.feature.geometry.coordinates[1],
                    longitude: featureHolder.feature.geometry.coordinates[0]
                }
            };

            if (!locationUtils.isWithinRadius(currentPosition, featureLoc, DEFAULT_SEARCH_RADIUS)) {
                console.log('featureViewerService - removing feature (' + featureHolder.feature.id + '-' +
                    featureHolder.feature.properties.title +
                    ') from featuresToViewStack collection as it is no longer in view');
                collection.splice(i, 1);
            }
        }
    }

    function clearFeaturesToViewIfNoLongerInView($scope, currentPosition) {
        clearFromCollectionIfNoLongerInView($scope.featureViewer.featuresToViewStack, currentPosition);
        clearFromCollectionIfNoLongerInView($scope.featureViewer.featuresAlreadyViewedInRadius, currentPosition);
    }

    return {
        start: function ($scope) {

            $scope.featureViewer = {
                featuresToViewStack: [],
                locationHolder: locationUtils.locationHolder(),
                featuresAlreadyViewedInRadius: []
            };

            $scope.$on('$destroy', function () {
                this.stop($scope);
            });

            function onError(err) {
                console.log('featureViewerService - Error occurred while processing location - could be benign such as if a bundle is not ' +
                    'available locally and there is no network: ' + JSON.stringify(err));
            }


            $scope.featureViewer.positionWatcher = geolocation.watchPosition(function (position) {
                if (!position || $scope.featureViewer.locationHolder.isEqualToLastLocation(position)) {
                    return;
                }
                //clear collection of current features in location radius

                console.log('featureViewerService - current position: ' + JSON.stringify(position));

                clearFeaturesToViewIfNoLongerInView($scope, position);

                var sk = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    radius: DEFAULT_SEARCH_RADIUS,
                    orderBy: 'distance'
                };
                bundlesService.searchBundleFeatures(sk, function(matches) {
                    processFeaturesToView($scope, matches, position);
                }, onError);
            });
        },
        broadcastViewEvents: function ($scope) {
            broadcastAndWaitForClose($scope);
        },
        addFeatureToView: function($scope, bundleId, featureId) {
            bundlesService.findById(bundleId, function(bundle) {
                var featureHolder = {};
                for (var i = 0; i < bundle.features.length; i++) {
                    if (Number(bundle.features[i].id) === Number(featureId)) {
                        featureHolder.bundle = bundle;
                        featureHolder.feature = bundle.features[i];
                        break;
                    }
                }
                processFeaturesToView($scope, [featureHolder]);
            }, function(err) {
                console.log('Error while looking for bundle (' + bundleId + '): ' + JSON.stringify(err), err);
            })
        },
        stop: function ($scope) {
            console.log('featureViewerService - featureViewerService::stop - canceling position watcher');
            if ($scope.featureViewer) {
                $scope.featureViewer.positionWatcher && geolocation.clearWatch($scope.featureViewer.positionWatcher);
                delete $scope.featureViewer; //empty out the array so no additional events will be fired
            }
        }
    }
};

myAppServices.factory('featureViewerService', function (safeApply, geolocation, bundlesService) {
    return featureViewerService(safeApply, geolocation, bundlesService);
});

//expose for testing through mocha/node
if (typeof exports !== "undefined") {
    exports.featureViewerService = featureViewerService;
}