/*
class to parse the .mid file format
(depends on stream.js)
*/
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./stream"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var stream_1 = require("./stream");
    var readChunk = function (stream) {
        var id = stream.read(4);
        var length = stream.readInt32();
        return {
            data: stream.read(length),
            id: id,
            length: length
        };
    };
    function MidiFile(data) {
        var lastEventTypeByte;
        // tslint:disable-next-line:no-shadowed-variable
        var readEvent = function (stream) {
            var event = {
                deltaTime: stream.readVarInt()
            };
            var eventTypeByte = stream.readInt8();
            // tslint:disable-next-line:no-bitwise
            if ((eventTypeByte & 0xf0) === 0xf0) {
                /* system / meta event */
                if (eventTypeByte === 0xff) {
                    /* meta event */
                    event.type = "meta";
                    var subtypeByte = stream.readInt8();
                    var length_1 = stream.readVarInt();
                    switch (subtypeByte) {
                        case 0x00:
                            event.subtype = "sequenceNumber";
                            if (length_1 !== 2) {
                                throw new Error("Expected length for sequenceNumber event is 2, got " + length_1);
                            }
                            event.number = stream.readInt16();
                            return event;
                        case 0x01:
                            event.subtype = "text";
                            event.text = stream.read(length_1);
                            return event;
                        case 0x02:
                            event.subtype = "copyrightNotice";
                            event.text = stream.read(length_1);
                            return event;
                        case 0x03:
                            event.subtype = "trackName";
                            event.text = stream.read(length_1);
                            return event;
                        case 0x04:
                            event.subtype = "instrumentName";
                            event.text = stream.read(length_1);
                            return event;
                        case 0x05:
                            event.subtype = "lyrics";
                            event.text = stream.read(length_1);
                            return event;
                        case 0x06:
                            event.subtype = "marker";
                            event.text = stream.read(length_1);
                            return event;
                        case 0x07:
                            event.subtype = "cuePoint";
                            event.text = stream.read(length_1);
                            return event;
                        case 0x20:
                            event.subtype = "midiChannelPrefix";
                            if (length_1 !== 1) {
                                throw new Error("Expected length for midiChannelPrefix event is 1, got " + length_1);
                            }
                            event.channel = stream.readInt8();
                            return event;
                        case 0x2f:
                            event.subtype = "endOfTrack";
                            if (length_1 !== 0) {
                                throw new Error("Expected length for endOfTrack event is 0, got " + length_1);
                            }
                            return event;
                        case 0x51:
                            event.subtype = "setTempo";
                            if (length_1 !== 3) {
                                throw new Error("Expected length for setTempo event is 3, got " + length_1);
                            }
                            event.microsecondsPerBeat = (
                            // tslint:disable-next-line:no-bitwise
                            (stream.readInt8() << 16)
                                // tslint:disable-next-line:no-bitwise
                                + (stream.readInt8() << 8)
                                + stream.readInt8());
                            return event;
                        case 0x54:
                            event.subtype = "smpteOffset";
                            if (length_1 !== 5) {
                                throw new Error("Expected length for smpteOffset event is 5, got " + length_1);
                            }
                            var hourByte = stream.readInt8();
                            event.frameRate = {
                                0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
                            }[hourByte & 0x60];
                            // tslint:disable-next-line:no-bitwise
                            event.hour = hourByte & 0x1f;
                            event.min = stream.readInt8();
                            event.sec = stream.readInt8();
                            event.frame = stream.readInt8();
                            event.subframe = stream.readInt8();
                            return event;
                        case 0x58:
                            event.subtype = "timeSignature";
                            if (length_1 !== 4) {
                                throw new Error("Expected length for timeSignature event is 4, got " + length_1);
                            }
                            event.numerator = stream.readInt8();
                            event.denominator = Math.pow(2, stream.readInt8());
                            event.metronome = stream.readInt8();
                            event.thirtyseconds = stream.readInt8();
                            return event;
                        case 0x59:
                            event.subtype = "keySignature";
                            if (length_1 !== 2) {
                                throw new Error("Expected length for keySignature event is 2, got " + length_1);
                            }
                            event.key = stream.readInt8(true);
                            event.scale = stream.readInt8();
                            return event;
                        case 0x7f:
                            event.subtype = "sequencerSpecific";
                            event.data = stream.read(length_1);
                            return event;
                        default:
                            // console.log("Unrecognised meta event subtype: " + subtypeByte);
                            event.subtype = "unknown";
                            event.data = stream.read(length_1);
                            return event;
                    }
                    event.data = stream.read(length_1);
                    return event;
                }
                else if (eventTypeByte === 0xf0) {
                    event.type = "sysEx";
                    var length_2 = stream.readVarInt();
                    event.data = stream.read(length_2);
                    return event;
                }
                else if (eventTypeByte === 0xf7) {
                    event.type = "dividedSysEx";
                    var length_3 = stream.readVarInt();
                    event.data = stream.read(length_3);
                    return event;
                }
                else {
                    throw new Error("Unrecognised MIDI event type byte: " + eventTypeByte);
                }
            }
            else {
                /* channel event */
                var param1 = void 0;
                // tslint:disable-next-line:no-bitwise
                if ((eventTypeByte & 0x80) === 0) {
                    /* running status - reuse lastEventTypeByte as the event type.
                      eventTypeByte is actually the first parameter
                    */
                    param1 = eventTypeByte;
                    eventTypeByte = lastEventTypeByte;
                }
                else {
                    param1 = stream.readInt8();
                    lastEventTypeByte = eventTypeByte;
                }
                // tslint:disable-next-line:no-bitwise
                var eventType = eventTypeByte >> 4;
                // tslint:disable-next-line:no-bitwise
                event.channel = eventTypeByte & 0x0f;
                event.type = "channel";
                switch (eventType) {
                    case 0x08:
                        event.subtype = "noteOff";
                        event.noteNumber = param1;
                        event.velocity = stream.readInt8();
                        return event;
                    case 0x09:
                        event.noteNumber = param1;
                        event.velocity = stream.readInt8();
                        if (event.velocity === 0) {
                            event.subtype = "noteOff";
                        }
                        else {
                            event.subtype = "noteOn";
                        }
                        return event;
                    case 0x0a:
                        event.subtype = "noteAftertouch";
                        event.noteNumber = param1;
                        event.amount = stream.readInt8();
                        return event;
                    case 0x0b:
                        event.subtype = "controller";
                        event.controllerType = param1;
                        event.value = stream.readInt8();
                        return event;
                    case 0x0c:
                        event.subtype = "programChange";
                        event.programNumber = param1;
                        return event;
                    case 0x0d:
                        event.subtype = "channelAftertouch";
                        event.amount = param1;
                        return event;
                    case 0x0e:
                        event.subtype = "pitchBend";
                        // tslint:disable-next-line:no-bitwise
                        event.value = param1 + (stream.readInt8() << 7);
                        return event;
                    default:
                        throw new Error("Unrecognised MIDI event type: " + eventType);
                    /*
                    console.log("Unrecognised MIDI event type: " + eventType);
                    stream.readInt8();
                    event.subtype = 'unknown';
                    return event;
                    */
                }
            }
        };
        var stream = stream_1["default"](data);
        var headerChunk = readChunk(stream);
        if (headerChunk.id !== "MThd" || headerChunk.length !== 6) {
            throw new Error("Bad .mid file - header not found");
        }
        var headerStream = stream_1["default"](headerChunk.data);
        var formatType = headerStream.readInt16();
        var trackCount = headerStream.readInt16();
        var timeDivision = headerStream.readInt16();
        var ticksPerBeat;
        // tslint:disable-next-line:no-bitwise
        if (timeDivision & 0x8000) {
            throw new Error("Expressing time division in SMTPE frames is not supported yet");
        }
        else {
            ticksPerBeat = timeDivision;
        }
        var header = {
            formatType: formatType,
            ticksPerBeat: ticksPerBeat,
            trackCount: trackCount
        };
        var tracks = [];
        for (var i = 0; i < header.trackCount; i++) {
            tracks[i] = [];
            var trackChunk = readChunk(stream);
            if (trackChunk.id !== "MTrk") {
                throw new Error("Unexpected chunk - expected MTrk, got " + trackChunk.id);
            }
            var trackStream = stream_1["default"](trackChunk.data);
            while (!trackStream.eof()) {
                var event_1 = readEvent(trackStream);
                tracks[i].push(event_1);
            }
        }
        this.header = header;
        this.tracks = tracks;
        return {
            header: header,
            tracks: tracks
        };
    }
    exports["default"] = MidiFile;
});
//# sourceMappingURL=midifile.js.map