"use strict";
/*
  ----------------------------------------------------------
  MIDI.Player : 0.3.1 : 2015-03-26
  ----------------------------------------------------------
  https://github.com/mudcube/MIDI.js
  ----------------------------------------------------------
*/
exports.__esModule = true;
var midifile_1 = require("../../inc/jasmid/midifile");
var replayer_1 = require("../../inc/jasmid/replayer");
var gm_1 = require("./gm");
var loader_1 = require("./loader");
var plugin_webaudio_1 = require("./plugin.webaudio");
// tslint:disable-next-line:variable-name
var Player = {
    currentTime: 0,
    endTime: 0,
    restart: 0,
    playing: false,
    timeWarp: 1,
    startDelay: 0,
    BPM: 120,
    MIDIOffset: null,
    data: null,
    currentData: null,
    replayer: null,
    ctx: null,
    animationFrameId: null,
    resume: function (onsuccess) {
        if (Player.currentTime < -1) {
            Player.currentTime = -1;
        }
        startAudio(Player.currentTime, null, onsuccess);
    },
    pause: function () {
        var tmp = Player.restart;
        stopAudio();
        Player.restart = tmp;
    },
    stop: function () {
        stopAudio();
        Player.restart = 0;
        Player.currentTime = 0;
    },
    addListener: function (onsuccess) {
        onMidiEvent = onsuccess;
    },
    removeListener: function () {
        onMidiEvent = undefined;
    },
    clearAnimation: function () {
        if (Player.animationFrameId) {
            cancelAnimationFrame(Player.animationFrameId);
        }
    },
    setAnimation: function (callback) {
        var currentTime = 0;
        var tOurTime = 0;
        var tTheirTime = 0;
        Player.clearAnimation();
        var frame = function () {
            Player.animationFrameId = requestAnimationFrame(frame);
            if (Player.endTime === 0) {
                return;
            }
            if (Player.playing) {
                currentTime = (tTheirTime === Player.currentTime) ? tOurTime - Date.now() : 0;
                if (Player.currentTime === 0) {
                    currentTime = 0;
                }
                else {
                    currentTime = Player.currentTime - currentTime;
                }
                if (tTheirTime !== Player.currentTime) {
                    tOurTime = Date.now();
                    tTheirTime = Player.currentTime;
                }
            }
            else { // paused
                currentTime = Player.currentTime;
            }
            ///
            var endTime = Player.endTime;
            var percent = currentTime / endTime;
            var total = currentTime / 1000;
            var minutes = total / 60;
            var seconds = total - (minutes * 60);
            var t1 = minutes * 60 + seconds;
            var t2 = (endTime / 1000);
            ///
            if (t2 - t1 < -1.0) {
                return;
            }
            else {
                callback({
                    end: t2,
                    events: noteRegistrar,
                    now: t1
                });
            }
        };
        requestAnimationFrame(frame);
    },
    // helpers
    loadMidiFile: function (onsuccess, onprogress, onerror) {
        try {
            Player.replayer = new replayer_1["default"](midifile_1["default"](Player.currentData), Player.timeWarp, null, Player.BPM);
            Player.data = Player.replayer.getData();
            Player.endTime = getLength();
            loader_1["default"].loadPlugin({
                onerror: onerror,
                onprogress: onprogress,
                onsuccess: onsuccess
            });
        }
        catch (event) {
            if (onerror) {
                onerror(event);
            }
        }
    },
    loadFile: function (file, onsuccess, onprogress, onerror) {
        Player.stop();
        if (file.indexOf("base64,") !== -1) {
            var data = window.atob(file.split(",")[1]);
            Player.currentData = data;
            Player.loadMidiFile(onsuccess, onprogress, onerror);
        }
        else {
            var fetch_1 = new XMLHttpRequest();
            fetch_1.open("GET", file);
            fetch_1.overrideMimeType("text/plain; charset=x-user-defined");
            fetch_1.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        var t = this.responseText || "";
                        var ff = [];
                        var mx = t.length;
                        var scc = String.fromCharCode;
                        for (var z = 0; z < mx; z++) {
                            // tslint:disable-next-line:no-bitwise
                            ff[z] = scc(t.charCodeAt(z) & 255);
                        }
                        ///
                        var data = ff.join("");
                        Player.currentData = data;
                        Player.loadMidiFile(onsuccess, onprogress, onerror);
                    }
                    else {
                        if (onerror) {
                            onerror("Unable to load MIDI file");
                        }
                    }
                }
            };
            fetch_1.send();
        }
    },
    getFileInstruments: function () {
        var instruments = {};
        var programs = {};
        for (var _i = 0, _a = Player.data; _i < _a.length; _i++) {
            var dataItem = _a[_i];
            var event_1 = dataItem[0].event;
            if (event_1.type !== "channel") {
                continue;
            }
            var channel = event_1.channel;
            switch (event_1.subtype) {
                case "controller":
                    break;
                case "programChange":
                    programs[channel] = event_1.programNumber;
                    break;
                case "noteOn":
                    var program = programs[channel];
                    var gm = gm_1["default"].byId[isFinite(program) ? program : channel];
                    instruments[gm.id] = true;
                    break;
            }
        }
        var ret = [];
        for (var key in instruments) {
            if (!Object.prototype.hasOwnProperty.call(instruments, key)) {
                continue;
            }
            ret.push(key);
        }
        return ret;
    }
};
// Playing the audio
var eventQueue = []; // hold events to be triggered
var queuedTime; //
var startTime = 0; // to measure time elapse
var noteRegistrar = {}; // get event for requested note
var onMidiEvent; // listener
var scheduleTracking = function (channel, note, currentTime, offset, message, velocity) {
    return setTimeout(function () {
        var data = {
            channel: channel,
            end: Player.endTime,
            message: message,
            note: note,
            now: currentTime,
            velocity: velocity
        };
        if (message === 128) {
            delete noteRegistrar[note];
        }
        else {
            noteRegistrar[note] = data;
        }
        if (onMidiEvent) {
            onMidiEvent(data);
        }
        Player.currentTime = currentTime;
        ///
        eventQueue.shift();
        ///
        if (eventQueue.length < 1000) {
            startAudio(queuedTime, true);
        }
        else if (Player.currentTime === queuedTime && queuedTime < Player.endTime) { // grab next sequence
            startAudio(queuedTime, true);
        }
    }, currentTime - offset);
};
var getContext = function () {
    if (loader_1["default"].defaultPlugin.api === "webaudio") {
        return plugin_webaudio_1["default"].getContext();
    }
    else {
        Player.ctx = { currentTime: 0 };
    }
    return Player.ctx;
};
var getLength = function () {
    var data = Player.data;
    var length = data.length;
    var totalTime = 0.5;
    for (var n = 0; n < length; n++) {
        totalTime += data[n][1];
    }
    return totalTime;
};
// tslint:disable-next-line:variable-name
var __now;
var getNow = function () {
    if (window.performance && window.performance.now) {
        return window.performance.now();
    }
    else {
        return Date.now();
    }
};
var startAudio = function (currentTime, fromCache, onsuccess) {
    if (!Player.replayer) {
        return;
    }
    if (!fromCache) {
        if (typeof currentTime === "undefined") {
            currentTime = Player.restart;
        }
        if (Player.playing) {
            stopAudio();
        }
        Player.playing = true;
        Player.data = Player.replayer.getData();
        Player.endTime = getLength();
    }
    var note;
    var offset = 0;
    var messages = 0;
    var data = Player.data;
    var ctx = getContext();
    var length = data.length;
    queuedTime = 0.5;
    var interval = eventQueue[0] && eventQueue[0].interval || 0;
    var foffset = currentTime - Player.currentTime;
    if (loader_1["default"].defaultPlugin.api !== "webaudio") { // set currentTime on ctx
        var now = getNow();
        __now = __now || now;
        ctx.currentTime = (now - __now) / 1000;
    }
    startTime = ctx.currentTime;
    for (var n = 0; n < length && messages < 100; n++) {
        var obj = data[n];
        queuedTime += obj[1];
        if (queuedTime <= currentTime) {
            offset = queuedTime;
            continue;
        }
        currentTime = queuedTime - offset;
        var event_2 = obj[0].event;
        if (event_2.type !== "channel") {
            continue;
        }
        var channelId = event_2.channel;
        var channel = gm_1["default"].channels[channelId];
        var delay = ctx.currentTime + ((currentTime + foffset + Player.startDelay) / 1000);
        var queueTime = queuedTime - offset + Player.startDelay;
        switch (event_2.subtype) {
            case "controller":
                loader_1["default"].defaultPlugin.setController(channelId, event_2.controllerType, event_2.value, delay);
                break;
            case "programChange":
                loader_1["default"].defaultPlugin.programChange(channelId, event_2.programNumber, delay);
                break;
            case "pitchBend":
                loader_1["default"].defaultPlugin.pitchBend(channelId, event_2.value, delay);
                break;
            case "noteOn":
                if (channel.mute) {
                    break;
                }
                note = event_2.noteNumber - (Player.MIDIOffset || 0);
                eventQueue.push({
                    event: event_2,
                    interval: scheduleTracking(channelId, note, queuedTime + Player.startDelay, offset - foffset, 144, event_2.velocity),
                    source: loader_1["default"].defaultPlugin.noteOn(channelId, event_2.noteNumber, event_2.velocity, delay),
                    time: queueTime
                });
                messages++;
                break;
            case "noteOff":
                if (channel.mute) {
                    break;
                }
                note = event_2.noteNumber - (Player.MIDIOffset || 0);
                eventQueue.push({
                    event: event_2,
                    interval: scheduleTracking(channelId, note, queuedTime, offset - foffset, 128, 0),
                    source: loader_1["default"].defaultPlugin.noteOff(channelId, event_2.noteNumber, delay),
                    time: queueTime
                });
                break;
            default:
                break;
        }
    }
    if (onsuccess) {
        onsuccess(eventQueue);
    }
};
Object.defineProperties(Player, {
    start: {
        configurable: true,
        enumerable: true,
        value: Player.resume
    }
});
var stopAudio = function () {
    var ctx = getContext();
    Player.playing = false;
    Player.restart += (ctx.currentTime - startTime) * 1000;
    // stop the audio, and intervals
    while (eventQueue.length) {
        var o = eventQueue.pop();
        window.clearInterval(o.interval);
        if (!o.source) {
            continue;
        } // is not webaudio
        if (typeof (o.source) === "number") {
            window.clearTimeout(o.source);
        }
        else { // webaudio
            o.source.disconnect(0);
        }
    }
    // run callback to cancel any notes still playing
    for (var key in noteRegistrar) {
        if (!Object.prototype.hasOwnProperty.call(noteRegistrar, key)) {
            continue;
        }
        var o = noteRegistrar[key];
        if (noteRegistrar[key].message === 144 && onMidiEvent) {
            onMidiEvent({
                channel: o.channel,
                end: o.end,
                message: 128,
                note: o.note,
                now: o.now,
                velocity: o.velocity
            });
        }
    }
    // reset noteRegistrar
    noteRegistrar = {};
};
exports["default"] = Player;
