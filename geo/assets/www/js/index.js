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

/**
 * Monkey patch in the getScript method to zepto since it's needed when running
 * as a phonegap app to load the cordova-2.9.0.js script
 */
;
(function ($) {

    $.getScript = function (url, success, error) {
        var script = document.createElement("script"),
            $script = $(script);
        script.src = url;

        $("head").append(script);
        $script.bind("load", success);
        $script.bind("error", error);
    };

})(Zepto);

var app = {
    // Application Constructor
    initialize: function () {
        console.log('phone: ' + $.os.phone);
        console.log('tablet: ' + $.os.tablet);
        if (!$.os.phone && !$.os.tablet) {
            console.log('Running on desktop, will use Node.js for database access...');
        } else {
            console.log('Running in device as PhoneGap app, loading cordova library and using local SQLite db...');

            var handleMove = function (e) {
                if ($(e.target).closest('.scrollable').length == 0) {
                    console.log('busting touchmove');
                    e.preventDefault();
                }
            };
            document.addEventListener('touchmove', handleMove, true);

            var that = this;

            var droidScripts = [
                "lib/cordova-android.js",
                "lib/SQLitePlugin-android.js"
            ];
            var iosScripts = [
                "lib/cordova-ios.js",
                "lib/SQLitePlugin-ios.js"
            ];

            if ($.os.ios) {
                document.addEventListener('touchend', function preventZoom(e) {
                    console.log('received touchend event');
                });

                document.addEventListener('touchstart', function preventZoom(e) {
                    console.log('received touchstart event');
                    var t2 = e.timeStamp,
                        t1 = $(e.target).data('lastTouch') || t2,
                        dt = t2 - t1,
                        fingers = e.touches.length;
                    $(e.target).data('lastTouch', t2);
                    if (!dt || dt > 500 || fingers > 1) return; // not double-tap

                    console.log('preventing double tap');
                    e.preventDefault(); // double tap - prevent the zoom
                    // also synthesize click events we just swallowed up
                    $(e.target).trigger('click').trigger('click');
                });

            }

            console.log('initializing');
            if ($.os.android) droidScripts.forEach(loadScript);
            if ($.os.ios) {
                console.log('loading scripts: ' + iosScripts);
                iosScripts.forEach(loadScript);
            }

            function loadScript(script) {
                console.log('getting script: ' + script);
                $.getScript(script, function () {
                    console.log('Loaded ' + script + '...');
                });
            }
        }

    }
};
