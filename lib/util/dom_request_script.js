/*
    -----------------------------------------------------------
    dom.loadScript.js : 0.1.4 : 2014/02/12 : http://mudcu.be
    -----------------------------------------------------------
    Copyright 2011-2014 Mudcube. All rights reserved.
    -----------------------------------------------------------
    /// No verification
    loadScript.add("../js/jszip/jszip.js");
    /// Strict loading order and verification.
    loadScript.add({
        strictOrder: true,
        urls: [
            {
                url: "../js/jszip/jszip.js",
                verify: "JSZip",
                onsuccess: function() {
                    console.log(1)
                }
            },
            {
                url: "../inc/downloadify/js/swfobject.js",
                verify: "swfobject",
                onsuccess: function() {
                    console.log(2)
                }
            }
        ],
        onsuccess: function() {
            console.log(3)
        }
    });
    /// Just verification.
    loadScript.add({
        url: "../js/jszip/jszip.js",
        verify: "JSZip",
        onsuccess: function() {
            console.log(1)
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
    var globalExists = function (path, root) {
        if (root === void 0) { root = window; }
        try {
            path = path.split('"').join("").split("'").join("").split("]").join("").split("[").join(".");
            var parts = path.split(".");
            var length_1 = parts.length;
            for (var n = 0; n < length_1; n++) {
                var key = parts[n];
                if (root[key] == null) {
                    return false;
                }
                else { //
                    root = root[key];
                }
            }
            return true;
        }
        catch (e) {
            return false;
        }
    };
    var loadScript = /** @class */ (function () {
        function loadScript() {
            this.loaded = {};
            this.loading = {};
        }
        loadScript.prototype.add = function (config) {
            var _this = this;
            if (typeof (config) === "string") {
                config = { url: config };
            }
            var urls = config.urls;
            if (typeof (urls) === "undefined") {
                urls = [{
                        url: config.url,
                        verify: config.verify
                    }];
            }
            /// adding the elements to the head
            var doc = document.getElementsByTagName("head")[0];
            var testElement = function (element, test) {
                if (test === void 0) { test = null; }
                if (_this.loaded[element.url]) {
                    return;
                }
                if (test && globalExists(test) === false) {
                    return;
                }
                _this.loaded[element.url] = true;
                if (_this.loading[element.url]) {
                    _this.loading[element.url]();
                }
                delete _this.loading[element.url];
                if (element.onsuccess) {
                    element.onsuccess();
                }
                if (typeof window.getNext !== "undefined") {
                    window.getNext();
                }
            };
            var hasError = false;
            var batchTest = [];
            var addElement = function (element) {
                if (typeof (element) === "string") {
                    element = {
                        url: element,
                        verify: config.verify
                    };
                }
                if (/([\w\d.\[\]\'\"])$/.test(element.verify)) { // check whether its a variable reference
                    var verify = element.test = element.verify;
                    if (typeof (verify) === "object") {
                        for (var n = 0; n < verify.length; n++) {
                            batchTest.push(verify[n]);
                        }
                    }
                    else {
                        batchTest.push(verify);
                    }
                }
                if (_this.loaded[element.url]) {
                    return;
                }
                var script = document.createElement("script");
                script.onreadystatechange = function () {
                    if (this.readyState !== "loaded" && this.readyState !== "complete") {
                        return;
                    }
                    testElement(element);
                };
                script.onload = function () {
                    testElement(element);
                };
                script.onerror = function () {
                    hasError = true;
                    delete this.loading[element.url];
                    if (typeof element.test === "object") {
                        for (var key in element.test) {
                            removeTest(element.test[key]);
                        }
                    }
                    else {
                        removeTest(element.test);
                    }
                };
                script.setAttribute("type", "text/javascript");
                script.setAttribute("src", element.url);
                doc.appendChild(script);
                _this.loading[element.url] = function () { };
                /// checking to see whether everything loaded properly
                var removeTest = function (test) {
                    var ret = [];
                    for (var n = 0; n < batchTest.length; n++) {
                        if (batchTest[n] === test) {
                            continue;
                        }
                        ret.push(batchTest[n]);
                    }
                    batchTest = ret;
                };
                var onLoad = function (element) {
                    if (element) {
                        testElement(element, element.test);
                    }
                    else {
                        for (var n = 0; n < urls.length; n++) {
                            testElement(urls[n], urls[n].test);
                        }
                    }
                    var istrue = true;
                    for (var n = 0; n < batchTest.length; n++) {
                        if (globalExists(batchTest[n]) === false) {
                            istrue = false;
                        }
                    }
                    if (!config.strictOrder && istrue) { // finished loading all the requested scripts
                        if (hasError) {
                            if (config.error) {
                                config.error();
                            }
                        }
                        else if (config.onsuccess) {
                            config.onsuccess();
                        }
                    }
                    else { // keep calling back the function
                        setTimeout(function () {
                            onLoad(element);
                        }, 10);
                    }
                };
                /// loading methods;  strict ordering or loose ordering
                if (config.strictOrder) {
                    var ID_1 = -1;
                    var getNext_1 = function () {
                        ID_1++;
                        if (!urls[ID_1]) { // all elements are loaded
                            if (hasError) {
                                if (config.error) {
                                    config.error();
                                }
                            }
                            else if (config.onsuccess) {
                                config.onsuccess();
                            }
                        }
                        else { // loading new script
                            var element_1 = urls[ID_1];
                            var url = element_1.url;
                            if (_this.loading[url]) { // already loading from another call (attach to event)
                                _this.loading[url] = function () {
                                    if (element_1.onsuccess) {
                                        element_1.onsuccess();
                                    }
                                    getNext_1();
                                };
                            }
                            else if (!_this.loaded[url]) { // create script element
                                addElement(element_1);
                                onLoad(element_1);
                            }
                            else { // it's already been successfully loaded
                                getNext_1();
                            }
                        }
                    };
                    getNext_1();
                }
                else { // loose ordering
                    for (var ID = 0; ID < urls.length; ID++) {
                        addElement(urls[ID]);
                        onLoad(urls[ID]);
                    }
                }
            };
        };
        return loadScript;
    }());
    exports["default"] = new loadScript();
});
//# sourceMappingURL=dom_request_script.js.map