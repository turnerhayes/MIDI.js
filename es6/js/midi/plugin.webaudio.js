"use strict";
/*
  ----------------------------------------------------------
  Web Audio API - OGG or MPEG Soundbank
  ----------------------------------------------------------
  http://webaudio.github.io/web-audio-api/
  ----------------------------------------------------------
*/
exports.__esModule = true;
var tunajs_1 = require("tunajs");
var Base64binary_1 = require("../../inc/shim/Base64binary");
var gm_1 = require("./gm");
var loader_1 = require("./loader");
var useStreamingBuffer = false; // !!audioContext.createMediaElementSource;
var ctx; // audio context
var sources = {};
var effects = {};
var masterVolume = 127;
function createAudioContext() {
    return new (window.AudioContext || window.webkitAudioContext)();
}
/* Load audio file: streaming | base64 | arraybuffer
---------------------------------------------------------------------- */
function loadAudio(url, onload, onerror) {
    if (useStreamingBuffer) {
        var audio_1 = new Audio();
        audio_1.src = url;
        audio_1.controls = false;
        audio_1.autoplay = false;
        audio_1.preload = "none";
        audio_1.addEventListener("canplay", function () {
            if (onload) {
                onload(audio_1);
            }
        });
        audio_1.addEventListener("error", function (err) {
            if (onerror) {
                onerror(err);
            }
        });
        document.body.appendChild(audio_1);
    }
    else if (url.indexOf("data:audio") === 0) { // Base64 string
        var base64 = url.split(",")[1];
        var buffer = Base64binary_1["default"].decodeArrayBuffer(base64);
        ctx.decodeAudioData(buffer, onload, onerror);
    }
    else { // XMLHTTP buffer
        var request_1 = new XMLHttpRequest();
        request_1.open("GET", url, true);
        request_1.responseType = "arraybuffer";
        request_1.onload = function () {
            ctx.decodeAudioData(request_1.response, onload, onerror);
        };
        request_1.send();
    }
}
var WebAudio = /** @class */ (function () {
    function WebAudio() {
        this.audioBuffers = {};
    }
    // tslint:disable-next-line:no-empty
    WebAudio.prototype.send = function (data, delay) { };
    // tslint:disable-next-line:no-empty
    WebAudio.prototype.setController = function (channelId, type, value, delay) { };
    WebAudio.prototype.setVolume = function (channelId, volume, delay) {
        if (delay) {
            setTimeout(function () {
                masterVolume = volume;
            }, delay * 1000);
        }
        else {
            masterVolume = volume;
        }
    };
    WebAudio.prototype.programChange = function (channelId, program) {
        var channel = gm_1["default"].channels[channelId];
        channel.instrument = program;
    };
    WebAudio.prototype.pitchBend = function (channelId, program) {
        var channel = gm_1["default"].channels[channelId];
        channel.pitchBend = program;
    };
    WebAudio.prototype.noteOn = function (channelId, noteId, velocity, delay) {
        delay = delay || 0;
        /// check whether the note exists
        var channel = gm_1["default"].channels[channelId];
        var instrument = channel.instrument;
        var bufferId = instrument + "" + noteId;
        var buffer = this.audioBuffers[bufferId];
        if (!buffer) {
            return;
        }
        /// convert relative delay to absolute delay
        if (delay < ctx.currentTime) {
            delay += ctx.currentTime;
        }
        var source;
        /// create audio buffer
        if (useStreamingBuffer) {
            source = ctx.createMediaElementSource(buffer);
        }
        else { // XMLHTTP buffer
            source = ctx.createBufferSource();
            source.buffer = buffer;
        }
        /// add effects to buffer
        if (effects) {
            var chain = source;
            for (var key in effects) {
                if (!Object.prototype.hasOwnProperty.call(effects, key)) {
                    continue;
                }
                chain.connect(effects[key].input);
                chain = effects[key];
            }
        }
        /// add gain + pitchShift
        var gain = (velocity / 127) * (masterVolume / 127) * 2 - 1;
        source.connect(ctx.destination);
        source.playbackRate.value = 1; // pitch shift
        source.gainNode = ctx.createGain(); // gain
        source.gainNode.connect(ctx.destination);
        source.gainNode.gain.value = Math.min(1.0, Math.max(-1.0, gain));
        source.connect(source.gainNode);
        if (useStreamingBuffer) {
            if (delay) {
                return setTimeout(function () {
                    buffer.currentTime = 0;
                    buffer.play();
                }, delay * 1000);
            }
            else {
                buffer.currentTime = 0;
                buffer.play();
            }
        }
        else {
            source.start(delay || 0);
        }
        sources[channelId + "" + noteId] = source;
        return source;
    };
    WebAudio.prototype.noteOff = function (channelId, noteId, delay) {
        delay = delay || 0;
        /// check whether the note exists
        var channel = gm_1["default"].channels[channelId];
        var instrument = channel.instrument;
        var bufferId = instrument + "" + noteId;
        var buffer = this.audioBuffers[bufferId];
        if (buffer) {
            if (delay < ctx.currentTime) {
                delay += ctx.currentTime;
            }
            ///
            var source = sources[channelId + "" + noteId];
            if (source) {
                if (source.gainNode) {
                    // @Miranet: 'the values of 0.2 and 0.3 could of course be used as
                    // a 'release' parameter for ADSR like time settings.'
                    // add { 'metadata': { release: 0.3 } } to soundfont files
                    var gain = source.gainNode.gain;
                    gain.linearRampToValueAtTime(gain.value, delay);
                    gain.linearRampToValueAtTime(-1.0, delay + 0.3);
                }
                if (useStreamingBuffer) {
                    if (delay) {
                        setTimeout(function () {
                            buffer.pause();
                        }, delay * 1000);
                    }
                    else {
                        buffer.pause();
                    }
                }
                else {
                    if (source.noteOff) {
                        source.noteOff(delay + 0.5);
                    }
                    else {
                        source.stop(delay + 0.5);
                    }
                }
                delete sources[channelId + "" + noteId];
                return source;
            }
        }
    };
    WebAudio.prototype.chordOn = function (channel, chord, velocity, delay) {
        var res = {};
        for (var n = 0, note = void 0, len = chord.length; n < len; n++) {
            res[note = chord[n]] = this.noteOn(channel, note, velocity, delay);
        }
        return res;
    };
    WebAudio.prototype.chordOff = function (channel, chord, delay) {
        var res = {};
        for (var n = 0, note = void 0, len = chord.length; n < len; n++) {
            res[note = chord[n]] = this.noteOff(channel, note, delay);
        }
        return res;
    };
    WebAudio.prototype.stopAllNotes = function () {
        for (var sid in sources) {
            if (!Object.prototype.hasOwnProperty.call(sources, sid)) {
                continue;
            }
            var delay = 0;
            if (delay < ctx.currentTime) {
                delay += ctx.currentTime;
            }
            var source = sources[sid];
            source.gain.linearRampToValueAtTime(1, delay);
            source.gain.linearRampToValueAtTime(0, delay + 0.3);
            if (source.noteOff) { // old api
                source.noteOff(delay + 0.3);
            }
            else { // new api
                source.stop(delay + 0.3);
            }
            delete sources[sid];
        }
    };
    WebAudio.prototype.setEffects = function (list) {
        if (ctx.tunajs) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var data = list_1[_i];
                var effect = new ctx.tunajs[data.type](data);
                effect.connect(ctx.destination);
                effects[data.type] = effect;
            }
        }
        else {
            return console.log("Effects module not installed.");
        }
    };
    WebAudio.prototype.connect = function (opts) {
        loader_1["default"].setDefaultPlugin(this);
        this.setContext(ctx || createAudioContext(), opts.onsuccess);
    };
    WebAudio.prototype.getContext = function () {
        return ctx;
    };
    WebAudio.prototype.setContext = function (newCtx, onload, onprogress, onerror) {
        ctx = newCtx;
        /// tuna.js effects module - https://github.com/Dinahmoe/tuna
        if (!ctx.tunajs) {
            ctx.tunajs = new tunajs_1["default"](ctx);
        }
        /// loading audio files
        var notes = gm_1["default"].keyToNote;
        var urls = Object.keys(notes);
        var waitForEnd = function () {
            for (var key in bufferPending) { // has pending items
                if (bufferPending[key]) {
                    return;
                }
            }
            if (onload) { // run onload once
                onload();
                onload = null;
            }
        };
        var requestAudio = function (soundfont, instrumentId, index, key) {
            var url = soundfont[key];
            if (url) {
                bufferPending[instrumentId]++;
                loadAudio(url, function (buffer) {
                    buffer.id = key;
                    var noteId = gm_1["default"].keyToNote[key];
                    this.audioBuffers[instrumentId + "" + noteId] = buffer;
                    if (--bufferPending[instrumentId] === 0) {
                        var percent = index / 87;
                        soundfont.isLoaded = true;
                        waitForEnd();
                    }
                }, function (err) {
                    console.error(err);
                });
            }
        };
        var bufferPending = {};
        var Soundfont = global.Soundfont;
        for (var instrument in Soundfont) {
            if (!Object.prototype.hasOwnProperty.call(Soundfont, instrument)) {
                continue;
            }
            var soundfont = Soundfont[instrument];
            if (soundfont.isLoaded) {
                continue;
            }
            var synth = gm_1["default"].byName[instrument];
            var instrumentId = synth.number;
            bufferPending[instrumentId] = 0;
            for (var index = 0; index < urls.length; index++) {
                var key = urls[index];
                requestAudio(soundfont, instrumentId, index, key);
            }
        }
        setTimeout(waitForEnd, 1);
    };
    return WebAudio;
}());
exports["default"] = new WebAudio();
