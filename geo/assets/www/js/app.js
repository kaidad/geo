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


var myAppServices = angular.module('myApp.services', []);
var myAppDirectives = angular.module('myApp.directives', []);
var myAppFilters = angular.module('myApp.filters', []);

// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', ['myApp.services', 'myApp.directives', 'myApp.filters', 'ng-iscroll',
    'ajoslin.mobile-navigate', 'ngMobile', 'angular-audio-player'])
    .config(function ($compileProvider) {
        console.log('config: urlSanitizationWhitelist');
        $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
    });

myApp.run(function ($timeout, $rootScope, safeApply, phonegapReady, mapService, configService, featureViewerService) {

    function loadBaseMapDb() {
        $rootScope.showBusy = true;
        $rootScope.headerMessage = "Downloading base map database...";
        mapService.loadDb(configService.baseDatabase, function() {
            console.log('done loading base map db');
            $rootScope.showBusy = false;
            $rootScope.headerMessage = "";
            safeApply($rootScope);
        });
    }

    $timeout(function () {
        console.log('myApp::run: waiting for phonegap to be ready');
        (phonegapReady(function () {

            loadBaseMapDb();

            //start feature viewer service - takes care of sending events when
            //a user's location intersects with features in their geo bundles
            featureViewerService.start($rootScope);

        }))();
    }, 500);


});
