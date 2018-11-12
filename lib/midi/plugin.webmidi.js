/*
  ----------------------------------------------------------------------
  Web MIDI API - Native Soundbanks
  ----------------------------------------------------------------------
  http://webaudio.github.io/web-midi-api/
  ----------------------------------------------------------------------
*/
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./loader"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var loader_1 = require("./loader");
    var plugin = null;
    var output = null;
    var channels = [];
    var WebMIDI = /** @class */ (function () {
        function WebMIDI() {
            this.api = "webmidi";
        }
        WebMIDI.prototype.send = function (data, delay) {
            output.send(data, delay * 1000);
        };
        WebMIDI.prototype.setController = function (channel, type, value, delay) {
            output.send([channel, type, value], delay * 1000);
        };
        WebMIDI.prototype.setVolume = function (channel, volume, delay) {
            output.send([0xB0 + channel, 0x07, volume], delay * 1000);
        };
        WebMIDI.prototype.programChange = function (channel, program, delay) {
            output.send([0xC0 + channel, program], delay * 1000);
        };
        WebMIDI.prototype.pitchBend = function (channel, program, delay) {
            output.send([0xE0 + channel, program], delay * 1000);
        };
        WebMIDI.prototype.noteOn = function (channel, note, velocity, delay) {
            output.send([0x90 + channel, note, velocity], delay * 1000);
        };
        WebMIDI.prototype.noteOff = function (channel, note, delay) {
            output.send([0x80 + channel, note, 0], delay * 1000);
        };
        WebMIDI.prototype.chordOn = function (channel, chord, velocity, delay) {
            for (var _i = 0, chord_1 = chord; _i < chord_1.length; _i++) {
                var note = chord_1[_i];
                output.send([0x90 + channel, note, velocity], delay * 1000);
            }
        };
        WebMIDI.prototype.chordOff = function (channel, chord, delay) {
            for (var _i = 0, chord_2 = chord; _i < chord_2.length; _i++) {
                var note = chord_2[_i];
                output.send([0x80 + channel, note, 0], delay * 1000);
            }
        };
        WebMIDI.prototype.stopAllNotes = function () {
            output.cancel();
            for (var channel = 0; channel < 16; channel++) {
                output.send([0xB0 + channel, 0x7B, 0]);
            }
        };
        WebMIDI.prototype.connect = function (opts) {
            loader_1["default"].setDefaultPlugin(this);
            var errFunction = function (err) {
                if (window.AudioContext) { // Chrome
                    opts.api = "webaudio";
                }
                else if (window.Audio) { // Firefox
                    opts.api = "audiotag";
                }
                else { // no support
                    return;
                }
                loader_1["default"].loadPlugin(opts);
            };
            navigator.requestMIDIAccess().then(function (access) {
                plugin = access;
                var pluginOutputs = plugin.outputs;
                if (typeof pluginOutputs === "function") { // Chrome pre-43
                    output = pluginOutputs()[0];
                }
                else { // Chrome post-43
                    output = pluginOutputs[0];
                }
                if (output === undefined) { // nothing there...
                    errFunction();
                }
                else {
                    if (opts.onsuccess) {
                        opts.onsuccess();
                    }
                }
            }, errFunction);
        };
        return WebMIDI;
    }());
    exports["default"] = new WebMIDI();
});
//# sourceMappingURL=plugin.webmidi.js.map