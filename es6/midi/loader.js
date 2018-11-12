"use strict";
/*
  ----------------------------------------------------------
  MIDI.Plugin : 0.3.4 : 2015-03-26
  ----------------------------------------------------------
  https://github.com/mudcube/MIDI.js
  ----------------------------------------------------------
  Inspired by javax.sound.midi (albeit a super simple version):
    http://docs.oracle.com/javase/6/docs/api/javax/sound/midi/package-summary.html
  ----------------------------------------------------------
  Technologies
  ----------------------------------------------------------
    Web MIDI API - no native support yet (jazzplugin)
    Web Audio API - firefox 25+, chrome 10+, safari 6+, opera 15+
    HTML5 Audio Tag - ie 9+, firefox 3.5+, chrome 4+, safari 4+, opera 9.5+, ios 4+, android 2.3+
  ----------------------------------------------------------
*/
exports.__esModule = true;
var dom_request_script_1 = require("../util/dom_request_script");
var dom_request_xhr_1 = require("../util/dom_request_xhr");
var audioDetect_1 = require("./audioDetect");
var gm_1 = require("./gm");
var plugin_webmidi_1 = require("./plugin.webmidi");
var sendRequest = function (instrumentId, audioFormat, onprogress, onsuccess, onerror) {
    var soundfontPath = "" + Loader.soundfontUrl + instrumentId + "-" + audioFormat + ".js";
    if (Loader.USE_XHR) {
        dom_request_xhr_1["default"]({
            format: "text",
            onerror: onerror,
            onprogress: onprogress,
            onsuccess: function (event, responseText) {
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.text = responseText;
                document.body.appendChild(script);
                ///
                onsuccess();
            },
            url: soundfontPath
        });
    }
    else {
        dom_request_script_1["default"].add({
            onerror: onerror,
            onsuccess: function () {
                onsuccess();
            },
            url: soundfontPath,
            verify: "MIDI.Soundfont[\"" + instrumentId + "\"]"
        });
    }
};
var requestQueue = function (opts, context) {
    var audioFormat = opts.format;
    var instruments = opts.instruments;
    var onprogress = opts.onprogress;
    var onerror = opts.onerror;
    var length = instruments.length;
    var pending = length;
    var waitForEnd = function () {
        if (!--pending) {
            if (onprogress) {
                onprogress("load", 1.0);
            }
            Loader.defaultPlugin[context].connect(opts);
        }
    };
    var _loop_1 = function (i) {
        var instrumentId = instruments[i];
        if ((window.Soundfont || {})[instrumentId]) { // already loaded
            waitForEnd();
        }
        else { // needs to be requested
            sendRequest(instruments[i], audioFormat, function (evt, progress) {
                var fileProgress = progress / length;
                var queueProgress = (length - pending) / length;
                if (onprogress) {
                    onprogress("load", fileProgress + queueProgress, instrumentId);
                }
            }, function () {
                waitForEnd();
            }, onerror);
        }
    };
    for (var i = 0; i < length; i++) {
        _loop_1(i);
    }
};
var connect = {
    webmidi: function (opts) {
        // cant wait for this to be standardized!
        plugin_webmidi_1["default"].connect(opts);
    },
    audiotag: function (opts) {
        // works ok, kinda like a drunken tuna fish, across the board
        // http://caniuse.com/audio
        requestQueue(opts, "AudioTag");
    },
    webaudio: function (opts) {
        // works awesome! safari, chrome and firefox support
        // http://caniuse.com/web-audio
        requestQueue(opts, "WebAudio");
    }
};
// tslint:disable-next-line:variable-name
var Loader = {
    DEBUG: true,
    __api: null,
    __audioFormat: null,
    defaultPlugin: {},
    soundfontUrl: "./soundfont/",
    USE_XHR: true,
    supports: {},
    loadPlugin: function (opts) {
        if (typeof opts === "function") {
            opts = { onsuccess: opts };
        }
        Loader.soundfontUrl = opts.soundfontUrl || Loader.soundfontUrl;
        /// Detect the best type of audio to use
        /*
          Loader.loadPlugin({
            onsuccess: function() { },
            onprogress: function(state, percent) { },
            targetFormat: 'mp3', // optionally can force to use MP3 (for instance on mobile networks)
            instrument: 'acoustic_grand_piano', // or 1 (default)
            instruments: [ 'acoustic_grand_piano', 'acoustic_guitar_nylon' ] // or multiple instruments
          });
        */
        audioDetect_1["default"](function (supports) {
            var hash = window.location.hash;
            var api = "";
            /// use the most appropriate plugin if not specified
            if (supports[opts.api]) {
                api = opts.api;
            }
            else if (supports[hash.substr(1)]) {
                api = hash.substr(1);
            }
            else if (supports.webmidi) {
                api = "webmidi";
            }
            else if (window.AudioContext) { // Chrome
                api = "webaudio";
            }
            else if (window.Audio) { // Firefox
                api = "audiotag";
            }
            if (connect[api]) {
                var audioFormat = void 0;
                /// use audio/ogg when supported
                if (opts.targetFormat) {
                    audioFormat = opts.targetFormat;
                }
                else { // use best quality
                    audioFormat = supports["audio/ogg"] ? "ogg" : "mp3";
                }
                /// load the specified plugin
                Loader.__api = api;
                Loader.__audioFormat = audioFormat;
                Loader.supports = supports;
                Loader.loadResource(opts);
            }
        });
    },
    /*
      Loader.loadResource({
        onsuccess: function() { },
        onprogress: function(state, percent) { },
        instrument: 'banjo'
      })
    */
    loadResource: function (opts) {
        var instruments = opts.instruments || opts.instrument || "acoustic_grand_piano";
        if (typeof instruments !== "object") {
            if (instruments || instruments === 0) {
                instruments = [instruments];
            }
            else {
                instruments = [];
            }
        }
        /// convert numeric ids into strings
        for (var i = 0; i < instruments.length; i++) {
            var instrument = instruments[i];
            if (instrument === +instrument) { // is numeric
                if (gm_1["default"].byId[instrument]) {
                    instruments[i] = gm_1["default"].byId[instrument].id;
                }
            }
        }
        opts.format = Loader.__audioFormat;
        opts.instruments = instruments;
        ///
        connect[Loader.__api](opts);
    },
    setDefaultPlugin: function (plugin) {
        Loader.defaultPlugin = plugin;
    }
};
exports["default"] = Loader;
