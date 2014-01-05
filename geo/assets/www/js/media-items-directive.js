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

myApp.directive('mediaItems', ['$compile', '$http', '$templateCache', function ($compile, $http, $templateCache) {
    var titleDiv = '<div class="kaidad-bundle-detail__feature-item-title">{{item.title}}</div>';
    var descriptionDiv = '<div class="kaidad-bundle-detail__feature-item-description">{{item.description}}</div>';
    var imageTemplate = '<div class="kaidad-bundle-detail__feature-item-photo">__title_div__<div class="kaidad-bundle-detail__feature-item-img"><img ng-src="{{item.url}}" alt="{{item.alt}}"></div>__description_div__</div>';
    var audioTemplate = '<div class="kaidad-bundle-detail__feature-item-audio">__title_div__<div class="kaidad-bundle-detail__feature-item-aud"><audio controls><source ng-src="{{item.url}}" type="{{item.mimeType}}">Your browser does not support the audio element.</audio></div>__description_div__</div>';
    var videoTemplate = '<div class="kaidad-bundle-detail__feature-item-video">__title_div__<div class="kaidad-bundle-detail__feature-item-vid"><video width="550" controls><source ng-src="{{item.url}}" type="{{item.mimeType}}">Your browser does not support the video element.</video></div>__description_div__</div>';
    var htmlTemplate = '<div class="kaidad-bundle-detail__feature-item-html"><div class="kaidad-bundle-detail__feature-item-copy"><ng:include src="htmlTemplateText"></ng:include></div></div>';
    var unsupportedTypeTemplate = '<div class="kaidad-bundle-detail__feature-item-unsupported">__title_div__<div class="kaidad-bundle-detail__feature-item-uns"><i class="icon-frown icon-2x">Sorry - we don&apos;t know how to display this type yet!</i></div>__description_div__</div>';

    var getTemplate = function(scope, item) {
        var template = unsupportedTypeTemplate;
        if (!item.mimeType) {
            console.log('Expected mimeType to be set - returning unsupported type');
            return template;
        }
        var contentType = item.mimeType.toLowerCase();
        if (contentType.indexOf('image') == 0) template = imageTemplate;
        if (contentType.indexOf('video') == 0) template = videoTemplate;
        if (contentType.indexOf('audio') == 0) template = audioTemplate;
        if (contentType.indexOf('text') == 0) {
            $http.get(scope.item.url, {cache:$templateCache});
            scope.htmlTemplateText=scope.item.url;
            template = htmlTemplate;
            console.log('media-items-directive::htmlTemplateText: ' + scope.item.url + ', template: ' + template);
        }
        if (item.title && item.title.trim().length > 0) {
            template = template.replace('__title_div__', titleDiv);
        } else {
            template = template.replace('__title_div__', '');
        }
        if (item.description && item.description.trim().length > 0) {
            template = template.replace('__description_div__', descriptionDiv);
        } else {
            template = template.replace('__description_div__', '');
        }
        return template;
    };

    var linker = function (scope, element) {
        element.html(getTemplate(scope, scope.item));

        $compile(element.contents())(scope);
    };

    return {
        restrict: "E",
        rep1ace: true,
        link: linker,
        scope: {
            item:'='
        }
    };
}]);