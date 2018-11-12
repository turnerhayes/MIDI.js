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
    var clone = function (o) {
        if (typeof o !== "object") {
            return (o);
        }
        if (o == null) {
            return (o);
        }
        var ret = (typeof o.length === "number") ? [] : {};
        for (var key in o) {
            if (!Object.prototype.hasOwnProperty.call(o, key)) {
                continue;
            }
            ret[key] = clone(o[key]);
        }
        return ret;
    };
    var Replayer = /** @class */ (function () {
        function Replayer(midiFile, timeWarp, eventProcessor, bpm) {
            this._data = null;
            var trackStates = [];
            var beatsPerMinute = bpm ? bpm : 120;
            var bpmOverride = bpm ? true : false;
            var ticksPerBeat = midiFile.header.ticksPerBeat;
            for (var i = 0; i < midiFile.tracks.length; i++) {
                trackStates[i] = {
                    nextEventIndex: 0,
                    ticksToNextEvent: (midiFile.tracks[i].length ?
                        midiFile.tracks[i][0].deltaTime :
                        null)
                };
            }
            var samplesToNextEvent = 0;
            function getNextEvent() {
                var ticksToNextEvent = null;
                var nextEventTrack = null;
                var nextEventIndex = null;
                for (var i = 0; i < trackStates.length; i++) {
                    if (trackStates[i].ticksToNextEvent != null
                        && (ticksToNextEvent == null || trackStates[i].ticksToNextEvent < ticksToNextEvent)) {
                        ticksToNextEvent = trackStates[i].ticksToNextEvent;
                        nextEventTrack = i;
                        nextEventIndex = trackStates[i].nextEventIndex;
                    }
                }
                if (nextEventTrack != null) {
                    /* consume event from that track */
                    var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
                    if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
                        trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
                    }
                    else {
                        trackStates[nextEventTrack].ticksToNextEvent = null;
                    }
                    trackStates[nextEventTrack].nextEventIndex += 1;
                    /* advance timings on all tracks by ticksToNextEvent */
                    for (var _i = 0, trackStates_1 = trackStates; _i < trackStates_1.length; _i++) {
                        var state = trackStates_1[_i];
                        if (state.ticksToNextEvent != null) {
                            state.ticksToNextEvent -= ticksToNextEvent;
                        }
                    }
                    return {
                        event: nextEvent,
                        ticksToEvent: ticksToNextEvent,
                        track: nextEventTrack
                    };
                }
                else {
                    return null;
                }
            }
            var midiEvent;
            var temporal = [];
            function processEvents() {
                function processNext() {
                    if (!bpmOverride &&
                        midiEvent.event.type === "meta" &&
                        midiEvent.event.subtype === "setTempo") {
                        // tempo change events can occur anywhere in the middle and affect events that follow
                        beatsPerMinute = 60000000 / midiEvent.event.microsecondsPerBeat;
                    }
                    var beatsToGenerate = 0;
                    var secondsToGenerate = 0;
                    if (midiEvent.ticksToEvent > 0) {
                        beatsToGenerate = midiEvent.ticksToEvent / ticksPerBeat;
                        secondsToGenerate = beatsToGenerate / (beatsPerMinute / 60);
                    }
                    var time = (secondsToGenerate * 1000 * timeWarp) || 0;
                    temporal.push([midiEvent, time]);
                    midiEvent = getNextEvent();
                }
                midiEvent = getNextEvent();
                while (midiEvent) {
                    processNext();
                }
            }
            processEvents();
            this._data = temporal;
        }
        Replayer.prototype.getData = function () {
            return clone(this._data);
        };
        return Replayer;
    }());
    exports["default"] = Replayer;
});
//# sourceMappingURL=replayer.js.map