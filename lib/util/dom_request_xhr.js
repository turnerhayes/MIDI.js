/*
    ----------------------------------------------------------
    util/Request : 0.1.1 : 2015-03-26
    ----------------------------------------------------------
    util.request({
        url: './dir/something.extension',
        data: 'test!',
        format: 'text', // text | xml | json | binary
        responseType: 'text', // arraybuffer | blob | document | json | text
        headers: {},
        withCredentials: true, // true | false
        ///
        onerror: function(evt, percent) {
            console.log(evt);
        },
        onsuccess: function(evt, responseText) {
            console.log(responseText);
        },
        onprogress: function(evt, percent) {
            percent = Math.round(percent * 100);
            loader.create('thread', 'loading... ', percent);
        }
    });
*/
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var NodeFS;
    /// NodeJS
    if (typeof module !== "undefined" && module.exports) {
        NodeFS = require("fs");
        global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    }
    var isLocalUrl = function (url) {
        return !/^https?:\/\//.test(url);
    };
    var XHRequest = function (opts, onsuccess, onerror, onprogress) {
        if (typeof opts === "string") {
            opts = {
                url: opts
            };
        }
        var data = opts.data;
        var url = opts.url;
        var method = opts.method || (opts.data ? "POST" : "GET");
        var format = opts.format;
        var headers = opts.headers;
        var responseType = opts.responseType;
        var withCredentials = opts.withCredentials || false;
        onsuccess = onsuccess || opts.onsuccess;
        onerror = onerror || opts.onerror;
        onprogress = onprogress || opts.onprogress;
        if (typeof NodeFS !== "undefined" && isLocalUrl(url)) {
            NodeFS.readFile(url, "utf8", function (err, res) {
                if (err) {
                    onerror && onerror(err);
                }
                else {
                    onsuccess && onsuccess({
                        responseText: res
                    });
                }
            });
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        if (headers) {
            for (var type in headers) {
                xhr.setRequestHeader(type, headers[type]);
            }
        }
        else if (data) { // set the default headers for POST
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        if (format === "binary") { // - default to responseType="blob" when supported
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType("text/plain; charset=x-user-defined");
            }
        }
        if (responseType) {
            xhr.responseType = responseType;
        }
        if (withCredentials) {
            xhr.withCredentials = true;
        }
        if (onerror && "onerror" in xhr) {
            xhr.onerror = onerror;
        }
        if (onprogress && xhr.upload && "onprogress" in xhr.upload) {
            if (data) {
                xhr.upload.onprogress = function (event) {
                    onprogress.call(xhr, event, event.loaded / event.total);
                };
            }
            else {
                xhr.addEventListener("progress", function (evt) {
                    var totalBytes = 0;
                    if (evt.lengthComputable) {
                        totalBytes = evt.total;
                    }
                    else if (xhr.totalBytes) {
                        totalBytes = xhr.totalBytes;
                    }
                    else {
                        var rawBytes = parseInt(xhr.getResponseHeader("Content-Length-Raw"));
                        if (isFinite(rawBytes)) {
                            xhr.totalBytes = totalBytes = rawBytes;
                        }
                        else {
                            return;
                        }
                    }
                    onprogress.call(xhr, evt, evt.loaded / totalBytes);
                });
            }
        }
        xhr.onreadystatechange = function (evt) {
            if (xhr.readyState === 4) { // The request is complete
                if (xhr.status === 200 || // Response OK
                    xhr.status === 304 || // Not Modified
                    xhr.status === 308 || // Permanent Redirect
                    xhr.status === 0 && window.cordova // Cordova quirk
                ) {
                    if (onsuccess) {
                        var res = void 0;
                        if (format === "xml") {
                            res = evt.target.responseXML;
                        }
                        else if (format === "text") {
                            res = evt.target.responseText;
                        }
                        else if (format === "json") {
                            try {
                                res = JSON.parse(evt.target.response);
                            }
                            catch (err) {
                                onerror && onerror.call(xhr, evt);
                            }
                        }
                        ///
                        onsuccess.call(xhr, evt, res);
                    }
                }
                else {
                    onerror && onerror.call(xhr, evt);
                }
            }
        };
        xhr.send(data);
        return xhr;
    };
    exports["default"] = XHRequest;
});
//# sourceMappingURL=dom_request_xhr.js.map