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

/*
 Things to take care of:
 1) error handling around files:
 a) no space left on device
 b) external storage not mounted or mounted in read-only
 */
var bundlesService = function ($q, $timeout, $rootScope, context, leafletService, navService, storageService, userPreferencesService, safeApply, configService, mapService) {
    var initialized = false, root = {}, BUNDLE_META_DATA = "geobundles", bundlesPath;

    bundlesPath = function (fileSystem) {
        return fileSystem.root.fullPath + root.config.bundlesLocalPath + "/";
    };

    function absolutePath(fileSystem, filePath) {
        var path = bundlesPath(fileSystem) + filePath;
        if (path.indexOf("file://") === 0) {
            path = path.substring(7);
        }
        return path;
    }

    root.$rootScope = $rootScope;
    root.config = configService;

    function initializeAndProceed(onSuccess, onError) {
        if (initialized) {
            onSuccess();
            return;
        }
        initialized = true;

        if (root.$rootScope === undefined || root.$rootScope === null ||
            root.config === undefined || root.config === null ||
            root.config.isPlainBrowser === undefined || root.config.serviceUrl === undefined) {
            var errorMessage = "BundlesDaoInitException: Invalid config - must contain isPlainBrowser and serviceUrl";
            console.log(errorMessage);
            if (onError) {
                onError(errorMessage);
            } else {
                throw new Error(errorMessage);
            }
        }
        console.log("bundlesService::guardInit: " + JSON.stringify(root.config) + ", isPlainBrowser: " + root.config.isPlainBrowser());
        fetchBundleMetadataFromServiceIfAvailable(onSuccess);
    }

    function loadFromTestData() {
        if (!configService || !configService.testData) {
            console.log('Loading metadata from service');
            return false;
        }

        console.log('Loading metadata from test data');
        var metadata = [];
        for (var i = 0; i < configService.testData.length; i++) {
            var meta = {};
            //clone it
            angular.extend(meta, configService.testData[i]);
            metadata.push(meta);
            //default to true for plain browsers
            if (configService.isPlainBrowser()) {
                meta.loaded = true;
            }
        }
        console.log('Before updating loaded status, metadata: ' + JSON.stringify(metadata));

        //if test seed data is present, just use that
        function updateLoadedStatusForAllBundles(fileSystem) {
            var processed = 0;

            function setIfDone() {
                if (++processed === metadata.length) {
                    console.log('AFTER updating loaded status, metadata: ' + JSON.stringify(metadata));
                    storageService.setItem(BUNDLE_META_DATA, JSON.stringify(metadata));
                }
            }

            for (var i = 0; i < metadata.length; i++) {
                var meta = metadata[i];
                console.log('checking to see if bundle exists: ' + meta.id);
                (function (meta) {
                    getBundleJsonFromFilesystem(fileSystem, meta.id, function () {
                        console.log('bundle exists!!!: ' + meta.id);
                        meta.loaded = true;
                        setIfDone();
                    }, function () {
                        console.log('bundle DOES NOT exist!!!: ' + meta.id);
                        meta.loaded = false;
                        setIfDone();
                    });
                })(meta);
            }
        }

        if (!configService.isPlainBrowser()) {
            context.requestFileSystem(LocalFileSystem.PERSISTENT, 0, updateLoadedStatusForAllBundles);
        } else {
            storageService.setItem(BUNDLE_META_DATA, JSON.stringify(metadata));
        }

        return true;
    }

    function fetchBundleMetadataFromServiceIfAvailable(onSuccess) {
        if (loadFromTestData()) {
            onSuccess();
            return;
        }

        var connectionType = root.config.connectionType();
        console.log('Synchronizing bundle ID list, connectionType: ' + connectionType);
        //if detect wifi

        var ConnectionEnum = {
            UNKNOWN: "unknown",
            ETHERNET: "ethernet",
            WIFI: "wifi",
            CELL_2G: "2g",
            CELL_3G: "3g",
            CELL_4G: "4g",
            CELL: "cellular",
            NONE: "none"
        };

        if (typeof(Connection) !== "undefined") {
            ConnectionEnum = Connection; //defer to phonegap's enum
        }

        if ((connectionType === ConnectionEnum.WIFI ||
            connectionType === ConnectionEnum.ETHERNET) ||
            (userPreferencesService.allowCellUse() &&
                (connectionType === ConnectionEnum.CELL ||
                    connectionType === ConnectionEnum.CELL_2G ||
                    connectionType === ConnectionEnum.CELL_3G ||
                    connectionType === ConnectionEnum.CELL_4G))) {

            var url = root.config.serviceUrl + "/bundle";
            console.log("Loading bundle metadata from remote server using url: " + url);
            $.ajax({
                url: url,
                data: {filter: 'meta'},
                timeout: 2000, //set a short timeout - just use the existing bundle metadata if the server doesn't respond
                success: function (data) {
                    console.log('loaded bundle metadata: ' + data);
                    storageService.setItem(BUNDLE_META_DATA, data);
                    onSuccess();
                },
                error: function (xhr, status, error) {
                    var message = "Error occurred while querying bundles: " + (status ? status + ", " : "") +
                        (error ? error : "");
                    console.log(message, error);

                    //call onSuccess anyway - could be because the service is unreachable, so we'll just use
                    //existing data
                    onSuccess();
                }
            });
        } else {
            console.log('Cannot synchronize bundle id list, proceeding anyway');
            onSuccess();
        }
    }

    function updateLoadedStatus(bundleId, status) {
        var metadata = JSON.parse(storageService.getItem(BUNDLE_META_DATA));
        for (var i = 0; i < metadata.length; i++) {
            var meta = metadata[i];
            if (meta.id === bundleId) {
                meta.loaded = status;
            }
        }

        var metaString = JSON.stringify(metadata);
        console.log('metaString: ' + metaString);
        storageService.setItem(BUNDLE_META_DATA, metaString);
    }

    function removeBundleFromDevice(bundleId, onSuccess, onError) {
        if (!bundleId) {
            console.log('Bundle ID needs to be valid!!!!');
            onError && onError('Bundle ID needs to be valid');
        }

        function localOnSuccess() {
            updateLoadedStatus(bundleId, false);
            onSuccess();
        }

        function removeBundle(fileSystem) {
            // check to see if bundle exists
            var file = fileSystem.root.getDirectory(absolutePath(fileSystem, bundleId), {create: false}, function (entry) {
                console.log("bundle directory exists: bundles/" + bundleId + ", removing it");
                entry.removeRecursively(localOnSuccess, onError);
            }, function () {
                // file does not exist
                console.log("bundle DOES NOT exist: bundles/" + bundleId + ", nothing to remove");
                localOnSuccess();
            });

        }

        context.requestFileSystem(LocalFileSystem.PERSISTENT, 0, removeBundle);
    }

    function getBundleJsonFromFilesystem(fileSystem, bundleId, cbIfExists, cbIfNotExists) {
        fileSystem.root.getFile(absolutePath(fileSystem, bundleId + "/bundle.json"), {create: false}, cbIfExists, cbIfNotExists);
    }

    function loadDatabaseFilesForBundle(bundle, onSuccess) {
        console.log('Loading database files for bundle: ' + bundle.id);
        $rootScope.headerMessage = "Extraction complete, downloading map databases...";
        var databasesToDownload = [];
        bundle.features && bundle.features.forEach(function (feature) {
            if (feature.geometry.type === "Polygon" && feature.properties.database) {
                databasesToDownload.push(feature.properties.database);
            }
        });

        var proceedAfterComplete = (function () {
            var numProcessed = 0;
            return function () {
                ++numProcessed;
                console.log('proceedAfterComplete: ' + numProcessed + ' of ' + databasesToDownload.length);
                if (numProcessed >= databasesToDownload.length) {
                    $rootScope.headerMessage = "";
                    onSuccess();
                }
            }
        })();

        if (databasesToDownload.length == 0) {
            proceedAfterComplete();
        } else {
            for (var i = 0; i < databasesToDownload.length; i++) {
                var db = databasesToDownload[i];
                console.log('Feature database: ' + db);
                $rootScope.headerMessage = "Downloading map database: " + db + "...";
                mapService.loadDb(db, proceedAfterComplete);
            }
        }
    }

    function reloadBundleToDevice(bundleId, onSuccess, onError) {
        if (!bundleId) {
            console.log('Bundle ID needs to be valid!!!!');
            onError && onError('Bundle ID needs to be valid');
        }

        function localOnSuccess() {
            updateLoadedStatus(bundleId, true);
            onSuccess();
        }

        function processDownloadedBundle(fileSystem, bundleId, entry) {
            $rootScope.headerMessage = "Download complete, extracting...";
            console.log("download complete: " + entry.fullPath);

            ExtractZipFilePlugin.extractFile(bundlesPath(fileSystem) + bundleId + ".zip", bundlesPath(fileSystem), function () {
                console.log("successfully extracted file for bundle (" + bundleId + ") - deleting zip file to save space");
                entry.remove();
                readBundleJson(bundleId, function (bundle) {
                    loadDatabaseFilesForBundle(bundle, localOnSuccess);
                }, onError);

            }, function (error) {
                var message = "Error unzipping file [" + entry.fullPath + "]: " + JSON.stringify(error);
                console.log(message, error);
                onError(error, message);
            });
        }

        function downloadBundle(fileSystem) {
            $rootScope.headerMessage = "Downloading Field Guide...";
            // file does not exist
            console.log("Bundle does not exist - downloading bundle: " + bundleId);

            var ft = new FileTransfer();
            ft.download(root.config.serviceUrl + "/bundles/" + bundleId + ".zip",
                bundlesPath(fileSystem) + bundleId + ".zip", function (entry) {
                    processDownloadedBundle(fileSystem, bundleId, entry);
                }, function (error) {
                    var message = "error with download: " + JSON.stringify(error);
                    console.log(message, error);
                    onError && onError(error, message);
                });
        }

        function existsCb() {
            console.log("bundle exists: bundles/" + bundleId);
            localOnSuccess();
        }

        function downloadBundleIfNotExists(fileSystem) {
            getBundleJsonFromFilesystem(fileSystem, bundleId, existsCb, function () {
                downloadBundle(fileSystem)
            });
        }

        context.requestFileSystem(LocalFileSystem.PERSISTENT, 0, downloadBundleIfNotExists);
    }

    function getMediaPath(bundleId, url, onSuccess) {
        if (root.config.isPlainBrowser()) {
            onSuccess("bundles/" + bundleId + "/" + url);
        } else {
            context.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                var path = absolutePath(fileSystem, bundleId + "/" + url);
                console.log('media path (in callback): ' + path);
                onSuccess(path);
            });
        }
    }

    function processFeaturesInBundle(bundle, onSuccess) {
        //TODO: refactor this to use promises or some mechanism to get rid of this nonsense
        if (bundle.features) {
            var featuresLeft = bundle.features.length;
            bundle.features.forEach(function (feature) {
                if (feature.properties) {
                    var mediaItemsLeft = 0;
                    if (feature.properties.mediaItems) {
                        mediaItemsLeft += feature.properties.mediaItems.length;
                    }
                    if (feature.properties.narration) {
                        mediaItemsLeft++;
                        getMediaPath(bundle.id, feature.properties.narration, function (path) {
                            console.log('processFeaturesInBundle::path: ' + path);
                            feature.properties.narration = path;
                            if (--mediaItemsLeft === 0) {
                                if (--featuresLeft === 0) {
                                    onSuccess();
                                }
                            }
                        });
                    }
                    if (feature.properties.mediaItems) {
                        feature.properties.mediaItems.forEach(function (mediaItem) {
                            if (mediaItem.url) {
                                getMediaPath(bundle.id, mediaItem.url, function (path) {
                                    console.log('processFeaturesInBundle::path: ' + path);
                                    mediaItem.url = path;
                                    if (--mediaItemsLeft === 0) {
                                        if (--featuresLeft === 0) {
                                            onSuccess();
                                        }
                                    }
                                });
                            } else {
                                if (--mediaItemsLeft === 0) {
                                    if (--featuresLeft === 0) {
                                        onSuccess();
                                    }
                                }
                            }
                        });
                    } else {
                        if (--featuresLeft === 0) {
                            onSuccess();
                        }
                    }
                }
            });
        } else {
            onSuccess();
        }
    }

    function readBundleJson(bundleId, onSuccess, onError) {
        var internalOnError = function (error) {
            var message = "Error occurred while trying to read bundle.json: " + JSON.stringify(error);
            console.log(message, error);
            onError && onError(error, message);
        };

        function readBundleJsonFromFileSystem(fileSystem) {
            var path = absolutePath(fileSystem, bundleId + "/bundle.json");
            console.log("file system retrieved, looking for: " + path);

            function onLoadEnd(evt) {
                var result = evt.target.result;
                if (result) {
                    var bundle = JSON.parse(result);
                    processFeaturesInBundle(bundle, function () {
                        onSuccess(bundle);
                    });
                } else {
                    internalOnError("Failed to read bundle.json for bundle ID: " + bundleId);
                }
            }

            function readFile(file) {
                var reader = new FileReader();
                reader.onloadend = onLoadEnd;
                reader.onerror = internalOnError;
                reader.readAsText(file, "UTF-8");
            }

            function processFile(entry) {
                entry.file(readFile, internalOnError);
            }

            //load bundle.json
            fileSystem.root.getFile(path, { create: false }, processFile, internalOnError);
        }

        if (root.config.isPlainBrowser()) {
            var url = root.config.serviceUrl + "/bundle/" + bundleId;
            console.log("Loading bundle.json from remote server using url: " + url);
            $.ajax({
                url: url,
                type: "GET",
                success: function (data, status, xhr) {
                    var bundle = JSON.parse(data);
                    processFeaturesInBundle(bundle, function () {
                        onSuccess(bundle);
                    });
                },
                error: function (xhr, status, error) {
                    console.log("Error occurred while querying bundles: " + (status ? status + ", " : "") + (error ? error : ""));
                    internalOnError("Error occurred while querying bundles: " + (status ? status + ", " : "") + (error ? error : ""));
                }
            });

        } else {
            context.requestFileSystem(LocalFileSystem.PERSISTENT, 0, readBundleJsonFromFileSystem, internalOnError);
        }
    }

    function iterateBundleMetadata(cbForEachBundle, cbWhenDoneWithAllBundles, onError) {
        initializeAndProceed(function () {
            var bundleMetadata = JSON.parse(storageService.getItem(BUNDLE_META_DATA));
            var d = $q.defer();
            var processed = 0;
            for (var i = 0; i < bundleMetadata.length; i++) {
                readBundleJson(bundleMetadata[i].id, function (bundle) {
                    cbForEachBundle(bundle);
                    if (++processed == bundleMetadata.length) {
                        d.resolve();
                        safeApply($rootScope);
                    }
                }, onError);
            }

            d.promise.then(function () {
                cbWhenDoneWithAllBundles && cbWhenDoneWithAllBundles();
            })

        }, onError);
    }

    return {
        getBundlesMetadata: function (onSuccess, onError) {
            initializeAndProceed(function () {
                onSuccess(JSON.parse(storageService.getItem(BUNDLE_META_DATA)));
            }, onError);
        },
        searchBundlesFromService: function (searchCriteria, onSuccess, onError) {
            if (!searchCriteria || (!searchCriteria.sk && (!searchCriteria.lat || !searchCriteria.lng))) {
                throw Error("Expected valid 'searchCriteria' - use #fetchBundleMetadataFromServiceIfAvailable to return all bundles");
            }
            console.log("#searchBundles(" + JSON.stringify(searchCriteria) + ")");

            var url = root.config.serviceUrl + "/bundle";
            console.log("Loading bundles from remote server using url: " + url);
            $.ajax({
                url: url,
                params: searchCriteria,
                success: function (data, status, xhr) {
                    onSuccess(data);
                },
                error: function (xhr, status, error) {
                    console.log("Error occurred while querying bundles: " + (status ? status + ", " : "") + (error ? error : ""));
                    onError && onError("Error occurred while querying bundles: " + (status ? status + ", " : "") + (error ? error : ""));
                }
            });

        },
        searchBundlesOnDevice: function (searchCriteria, onSuccess, onError) {
            if (!searchCriteria || (!searchCriteria.sk && (!searchCriteria.lat || !searchCriteria.lng))) {
                throw Error("Expected valid 'searchCriteria' - use #fetchBundleMetadataFromServiceIfAvailable to return all bundles");
            }
            console.log("#searchBundles(" + JSON.stringify(searchCriteria) + ")");

            var matches = [];

            function pushMatch(bundle) {
                matches.push(bundle);
            }

            function searchBundle(bundle, searchCriteria) {
                var fullTextMatch = true, locMatch = true;
                if (searchCriteria.sk) {
                    //TODO: should be regex
                    var fullText = bundle.title + " " + bundle.description;
                    fullTextMatch = fullText.toLowerCase().indexOf(searchCriteria.sk.toLowerCase()) > -1;
                }
                if (searchCriteria.lat && searchCriteria.lng) {
                    //need to check if this start point is within a given radius of the lat/lng in criteria
                    if (bundle.features.length > 0) {
                        locMatch = locationUtils.isWithinRadius(
                            {
                                coords: {
                                    latitude: searchCriteria.lat,
                                    longitude: searchCriteria.lng
                                }
                            },
                            {
                                coords: {
                                    latitude: bundle.features[0].geometry.coordinates[1],
                                    longitude: bundle.features[0].geometry.coordinates[0]
                                }
                            }, searchCriteria.radius);
                    }
                }
                fullTextMatch && locMatch && pushMatch(bundle);
            }

            iterateBundleMetadata(searchBundle, function () {
                onSuccess(matches);
            }, onError);
        },
        searchBundleFeatures: function (searchCriteria, onSuccess, onError) {
            if (!searchCriteria || (!searchCriteria.sk && (!searchCriteria.lat || !searchCriteria.lng))) {
                throw Error("Expected valid 'searchCriteria', but got: " + JSON.stringify(searchCriteria));
            }
            console.log("#searchBundles(" + JSON.stringify(searchCriteria) + ")");

            var matches = [];

            function pushMatch(bundle, feature) {
                matches.push({bundle: bundle, feature: feature});
            }

            function searchFeature(bundle, feature) {
                var fullTextMatch = true, locMatch = true;
                if (searchCriteria.sk) {
                    //TODO: should be regex
                    var fullText = feature.title + " " + feature.description;
                    fullTextMatch = fullText.toLowerCase().indexOf(searchCriteria.sk.toLowerCase()) > -1;
                }
                if (searchCriteria.lat && searchCriteria.lng) {
                    locMatch = false;
                    if (feature.geometry.coordinates[0] && feature.geometry.coordinates[1]) {
                        //need to check if this start point is within a given radius of the lat/lng in criteria
                        locMatch = locationUtils.isWithinRadius(
                            {
                                coords: {
                                    latitude: searchCriteria.lat,
                                    longitude: searchCriteria.lng
                                }
                            },
                            {
                                coords: {
                                    latitude: feature.geometry.coordinates[1],
                                    longitude: feature.geometry.coordinates[0]
                                }
                            }, searchCriteria.radius);
                    }
                }
                fullTextMatch && locMatch && pushMatch(bundle, feature);
            }

            function searchBundle(bundle) {
                if (bundle.features) {
                    for (var i = 0; i < bundle.features.length; i++) {
                        searchFeature(bundle, bundle.features[i]);
                    }
                }
            }

            iterateBundleMetadata(searchBundle, function () {
                onSuccess(matches);
            }, onError);

        },
        findById: function (id, onSuccess, onError) {
            readBundleJson(id, onSuccess, onError);
        },
        create: function (bundle, onSuccess, onError) {
            console.log("Not implemented yet!");
            onSuccess();
        },
        reloadBundle: function (id, onSuccess, onError) {
            initializeAndProceed(function () {
                reloadBundleToDevice(id, onSuccess, onError);
            }, onError);
        },
        removeBundleFromDevice: function (id, onSuccess, onError) {
            initializeAndProceed(function () {
                removeBundleFromDevice(id, onSuccess, onError);
            }, onError);
        },
        displayBundles: function ($rootScope, $scope, mapBag, $compile, onSuccess, onError) {
            if (!mapBag || !mapBag.mapScope || !onSuccess) {
                throw new Error("kaidadBag must be initialized and onSuccess MUST be set");
            }
            if (!mapBag.mapScope) {
                throw new Error("Map must be initialized before trying to load markers on it!");
            }

            console.log("displayBundles, initializing...");

            function displayBundle(bundle) {

                if (bundle === null || typeof bundle === "undefined") {
                    onError("Could not load bundle for bundle ID: " + bundle.id);
                    return;
                }

                var addedFirstPoint = (function () {
                    var added = false;
                    return function () {
                        var wasAdded = added;
                        added = true;
                        return wasAdded;
                    }
                })();

                function renderOverlay(marker, bundle, feature) {
                    console.log("showing details for feature: " + feature.properties.title);

                    if ($rootScope.currentMapBag !== mapBag) {
                        console.log('Error!!! - expected to be operating on current map bag');
                    }
                    var map = mapBag.mapScope.leaflet.map;
                    console.log('renderOverlay: setting view to: lat/lng(' + JSON.stringify(marker.getLatLng()) + '), zoom(' + mapBag.mapScope.defaults.maxZoom + ')');

                    map.setView(marker.getLatLng(), mapBag.mapScope.defaults.maxZoom);

                    $timeout(function () {
                        //shift marker to right hand side of map centered north south and 12% from east side of map
                        var bounds = map.getPixelBounds();
                        var width = bounds.max.x - bounds.min.x;
                        var x = Math.ceil(width * 0.85);
                        var height = bounds.max.y - bounds.min.y;
                        var y = Math.ceil(height * 0.5);

                        var markerPoint = map.latLngToContainerPoint(marker.getLatLng());

                        var panX = markerPoint.x - x;
                        var panY = markerPoint.y - y;
                        map.panBy([panX, panY]);

                        var pointList = [marker.getLatLng(), map.containerPointToLatLng([Math.ceil(width * 0.5), Math.ceil(height * 0.5)])];
                        var polyline = L.polyline(pointList, {color: 'black', weight: 3, opacity: 1.0}).addTo(map);
                        $rootScope.featureToShow = {
                            feature: feature,
                            bundleId: bundle.id,
                            polyline: polyline
                        };
                        $rootScope.eventToEmit = 'locationProximityEvent-closeFeatureOverlay-' + bundle.id + '-' + feature.id;
                        $rootScope.$on('locationProximityEvent-closeFeatureOverlay-' + bundle.id + '-' + feature.id, function () {
                            console.log('Caught close feature overlay event, removing polyline');
                            map.setView(marker.getLatLng(), mapBag.mapScope.defaults.maxZoom);
                            map.removeLayer(polyline);
                        });
                        $rootScope.showFeatureDetail = true;
                        safeApply($rootScope);
                    }, 1000);
                }

                function filterFeature(feature) {
                    if (feature.geometry.type === "Polygon") {
                        var zoom = mapBag.mapScope.leaflet.map.getZoom();

                        return feature.properties.minZoomDisplay <= zoom &&
                            feature.properties.maxZoomDisplay >= zoom;
                    } else if (feature.geometry.type === "Point") {
                        var maxBounds = mapBag.mapScope.maxBounds;
                        return feature.properties.showMarker &&
                            (feature.geometry.coordinates[1] >= maxBounds.southWest.lat &&
                                feature.geometry.coordinates[1] <= maxBounds.northEast.lat &&
                                feature.geometry.coordinates[0] >= maxBounds.southWest.lng &&
                                feature.geometry.coordinates[0] <= maxBounds.northEast.lng);
                    }
                    return false;
                }

                function addFeatureIfPolygon(feature, layer) {
                    if (feature.geometry.type === "Polygon" && feature.properties.database) {
                        layer.on("click", function () {
                            console.log("setting currentMap to [" + feature.properties.database + "] and reloading");
                            navService.navToNewMap(feature.properties.database);
                        });
                    }
                }

                function addPointToLayer(feature, latLng) {
                    //if called with routeParams, there must be a specific point of interest
                    //just find the first point and set the center on it so the map is
                    //centered on some point in the detail map
                    if ($rootScope.disableNavToLocation && !addedFirstPoint()) {
                        angular.extend(mapBag.mapScope, {
                            center: {
                                lat: latLng.lat,
                                lng: latLng.lng,
                                zoom: mapBag.mapMetadata.maxzoom
                            }
                        });
                        safeApply(mapBag.mapScope);
                    }
                    var marker = leafletService.buildMarker({
                        lat: latLng.lat,
                        lng: latLng.lng,
                        title: feature.properties.title,
                        message: feature.properties.description,
                        clickable: true,
                        riseOnHover: true,
                        opacity: 0.9
                    }, mapBag.mapScope.leaflet.map);

                    marker.on('click', function () {
                        renderOverlay(marker, bundle, feature);
                    });

                    var listener = $scope.$$listeners['locationProximityEvent-openFeatureOverlay-' + bundle.id + '-' + feature.id];
                    if (!listener) {
                        $scope.$on('locationProximityEvent-openFeatureOverlay-' + bundle.id + '-' + feature.id, function () {
                            console.log('Caught locationProximityEvent - showing feature overlay on map');
                            renderOverlay(marker, bundle, feature);
                        });
                    }

                    return marker;
                }

                L.geoJson(bundle, {
                    style: {
                        "color": "#ff7800",
                        "weight": 1,
                        "opacity": 0.35
                    },
                    filter: filterFeature,
                    onEachFeature: addFeatureIfPolygon,
                    pointToLayer: addPointToLayer
                }).addTo(mapBag.mapScope.leaflet.map);
            }

            iterateBundleMetadata(displayBundle, onSuccess, onError);
        }
    }
};

/**
 * Exposes the bundlesService for injection
 */
myAppServices.factory('bundlesService', function ($q, $timeout, $rootScope, $compile, leafletService, navService, storageService, userPreferencesService, safeApply, configService, mapService) {
    var svc = bundlesService($q, $timeout, $rootScope, window, leafletService, navService, storageService,
        userPreferencesService, safeApply, configService, mapService);
    svc.loadBundles = function ($scope, bag, callbackWhenDone) {
        $scope.$on("mapLoaded", function () {
            console.log("'mapLoaded' event fired, displaying bundles");
            svc.displayBundles($rootScope, $scope, bag, $compile, function () {
                callbackWhenDone();
                console.log("Done displaying bundles");
            }, function (error) {
                console.log("Error occurred while displaying bundles: " + JSON.stringify(error));
            });
        });
    };
    return svc;
});

//expose for testing through mocha/node
if (typeof exports !== "undefined") {
    exports.bundlesService = bundlesService;
}