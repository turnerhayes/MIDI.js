(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./gm", "./loader"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var gm_1 = require("./gm");
    var loader_1 = require("./loader");
    /*
      ----------------------------------------------------------------------
      AudioTag <audio> - OGG or MPEG Soundbank
      ----------------------------------------------------------------------
      http://dev.w3.org/html5/spec/Overview.html#the-audio-element
      ----------------------------------------------------------------------
    */
    // tslint:disable-next-line:variable-name
    var tag;
    if (window.Audio) {
        var AudioTag = /** @class */ (function () {
            function AudioTag() {
                this.api = "audiotag";
                this.audioBuffers = [];
                this.noteToKey = {};
                // instrumentId + noteId that is currently playing in each 'channel', for routing noteOff/chordOff calls
                this.notesOn = [];
                // the piano keys
                this.notes = {};
                // floating point
                this.volume = 127;
                // current channel
                // tslint:disable-next-line:variable-name
                this.buffer_nid = -1;
            }
            // tslint:disable-next-line:no-empty
            AudioTag.prototype.send = function (data, delay) { };
            // tslint:disable-next-line:no-empty
            AudioTag.prototype.setController = function (channel, type, value, delay) { };
            AudioTag.prototype.setVolume = function (channel, n) {
                this.volume = n; // - should be channel specific volume
            };
            AudioTag.prototype.programChange = function (channel, program) {
                gm_1["default"].channels[channel].instrument = program;
            };
            // tslint:disable-next-line:no-empty
            AudioTag.prototype.pitchBend = function (channel, program, delay) { };
            AudioTag.prototype.noteOn = function (channel, note, velocity, delay) {
                var id = this.noteToKey[note];
                if (!this.notes[id]) {
                    return;
                }
                if (delay) {
                    return setTimeout(function () {
                        this.playChannel(channel, id);
                    }, delay * 1000);
                }
                else {
                    this.playChannel(channel, id);
                }
            };
            // tslint:disable-next-line:no-empty
            AudioTag.prototype.noteOff = function (channel, note, delay) { };
            AudioTag.prototype.chordOn = function (channel, chord, velocity, delay) {
                var _loop_1 = function (n) {
                    var id = this_1.noteToKey[n];
                    if (!this_1.notes[id]) {
                        return "continue";
                    }
                    if (delay) {
                        return { value: setTimeout(function () {
                                this.playChannel(channel, id);
                            }, delay * 1000) };
                    }
                    else {
                        this_1.playChannel(channel, id);
                    }
                };
                var this_1 = this;
                for (var _i = 0, chord_1 = chord; _i < chord_1.length; _i++) {
                    var n = chord_1[_i];
                    var state_1 = _loop_1(n);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
            };
            AudioTag.prototype.chordOff = function (channel, chord, delay) {
                var _loop_2 = function (n) {
                    var id = this_2.noteToKey[n];
                    if (!this_2.notes[id]) {
                        return "continue";
                    }
                    if (delay) {
                        return { value: setTimeout(function () {
                                this.stopChannel(channel, id);
                            }, delay * 1000) };
                    }
                    else {
                        this_2.stopChannel(channel, id);
                    }
                };
                var this_2 = this;
                for (var _i = 0, chord_2 = chord; _i < chord_2.length; _i++) {
                    var n = chord_2[_i];
                    var state_2 = _loop_2(n);
                    if (typeof state_2 === "object")
                        return state_2.value;
                }
            };
            AudioTag.prototype.stopAllNotes = function () {
                for (var nid = 0, length_1 = this.audioBuffers.length; nid < length_1; nid++) {
                    this.audioBuffers[nid].pause();
                }
            };
            AudioTag.prototype.connect = function (opts) {
                loader_1["default"].setDefaultPlugin(this);
                for (var key in gm_1["default"].keyToNote) {
                    if (!Object.prototype.hasOwnProperty.call(gm_1["default"].keyToNote, key)) {
                        continue;
                    }
                    this.noteToKey[gm_1["default"].keyToNote[key]] = key;
                    this.notes[key] = { id: key };
                }
                if (opts.onsuccess) {
                    opts.onsuccess();
                }
            };
            AudioTag.prototype.playChannel = function (channel, note) {
                if (!gm_1["default"].channels[channel]) {
                    return;
                }
                var instrument = gm_1["default"].channels[channel].instrument;
                var instrumentId = gm_1["default"].byId[instrument].id;
                note = this.notes[note];
                if (note) {
                    var instrumentNoteId = instrumentId + "" + note.id;
                    var nid = (this.buffer_nid + 1) % this.audioBuffers.length;
                    var audio = this.audioBuffers[nid];
                    this.notesOn[nid] = instrumentNoteId;
                    if (!global.Soundfont[instrumentId]) {
                        if (loader_1["default"].DEBUG) {
                            console.log("404", instrumentId);
                        }
                        return;
                    }
                    audio.src = global.Soundfont[instrumentId][note.id];
                    audio.volume = this.volume / 127;
                    audio.play();
                    this.buffer_nid = nid;
                }
            };
            AudioTag.prototype.stopChannel = function (channel, note) {
                if (!gm_1["default"].channels[channel]) {
                    return;
                }
                var instrument = gm_1["default"].channels[channel].instrument;
                var instrumentId = gm_1["default"].byId[instrument].id;
                note = this.notes[note];
                if (note) {
                    var instrumentNoteId = instrumentId + "" + note.id;
                    for (var i = 0, len = this.audioBuffers.length; i < len; i++) {
                        var nid = (i + this.buffer_nid + 1) % len;
                        var cId = this.notesOn[nid];
                        if (cId && cId === instrumentNoteId) {
                            this.audioBuffers[nid].pause();
                            this.notesOn[nid] = null;
                            return;
                        }
                    }
                }
            };
            return AudioTag;
        }());
        tag = new AudioTag();
        for (var nid = 0; nid < 12; nid++) {
            tag.audioBuffers[nid] = new Audio();
        }
    }
    exports["default"] = tag ?
        tag :
        null;
});
//# sourceMappingURL=plugin.audiotag.js.map