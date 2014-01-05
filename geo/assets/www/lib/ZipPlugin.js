var ExtractZipFilePlugin = (function () {
    return {
        extractFile: function (file, destination, successCallback, errorCallback) {
            return cordova.exec(successCallback, errorCallback, "ExtractZipFilePlugin", "extract", [file, destination]);
        }
    }
})();