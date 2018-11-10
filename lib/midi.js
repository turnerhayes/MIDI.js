/*
    ----------------------------------------------------------
    MIDI.audioDetect : 0.3.2 : 2015-03-26
    ----------------------------------------------------------
    https://github.com/mudcube/MIDI.js
    ----------------------------------------------------------
    Probably, Maybe, No... Absolutely!
    Test to see what types of <audio> MIME types are playable by the browser.
    ----------------------------------------------------------
*/
define("js/midi/audioDetect", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    // object of supported file types
    var supports = {
        webmidi: false,
        webaudio: false,
        audiotag: false
    };
    var pending = 0; // pending file types to process
    var canPlayThrough = function (src) {
        pending++;
        var body = document.body;
        var audio = new Audio();
        var mime = src.split(";")[0];
        audio.id = "audio";
        audio.setAttribute("preload", "auto");
        audio.setAttribute("audiobuffer", "");
        audio.addEventListener("error", function () {
            body.removeChild(audio);
            supports[mime] = false;
            pending--;
        }, false);
        audio.addEventListener("canplaythrough", function () {
            body.removeChild(audio);
            supports[mime] = true;
            pending--;
        }, false);
        audio.src = "data:" + src;
        body.appendChild(audio);
    };
    var audioDetect = function (onsuccess) {
        /// detect jazz-midi plugin
        if (navigator.requestMIDIAccess) {
            var isNative = Function.prototype.toString.call(navigator.requestMIDIAccess).indexOf("[native code]");
            if (isNative) { // has native midiapi support
                supports.webmidi = true;
            }
            else { // check for jazz plugin midiapi support
                for (var n = 0; navigator.plugins.length > n; n++) {
                    var plugin = navigator.plugins[n];
                    if (plugin.name.indexOf("Jazz-Plugin") >= 0) {
                        supports.webmidi = true;
                    }
                }
            }
        }
        /// check whether <audio> tag is supported
        if (typeof (Audio) === "undefined") {
            return onsuccess({});
        }
        else {
            supports.audiotag = true;
        }
        /// check for webaudio api support
        if (window.AudioContext || window.webkitAudioContext) {
            supports.webaudio = true;
        }
        /// check whether canPlayType is supported
        var audio = new Audio();
        if (typeof (audio.canPlayType) === "undefined") {
            return onsuccess(supports);
        }
        /// see what we can learn from the browser
        var vorbisSupport = audio.canPlayType('audio/ogg; codecs="vorbis"');
        var vorbis = (vorbisSupport === "probably" || vorbisSupport === "maybe");
        var mpegSupport = audio.canPlayType("audio/mpeg");
        var mpeg = (mpegSupport === "probably" || mpegSupport === "maybe");
        // maybe nothing is supported
        if (!vorbis && !mpeg) {
            onsuccess(supports);
            return;
        }
        /// or maybe something is supported
        if (vorbis) {
            canPlayThrough("audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAA6p4zJQEAAAANJGeqCj3//////////5ADdm9yYmlzLQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMTAxMTAxIChTY2hhdWZlbnVnZ2V0KQAAAAABBXZvcmJpcw9CQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBACAAAAYRqF1TCqDEEPKQ4QUY9AzoxBDDEzGHGNONKQMMogzxZAyiFssLqgQBKEhKwKAKAAAwBjEGGIMOeekZFIi55iUTkoDnaPUUcoolRRLjBmlEluJMYLOUeooZZRCjKXFjFKJscRUAABAgAMAQICFUGjIigAgCgCAMAYphZRCjCnmFHOIMeUcgwwxxiBkzinoGJNOSuWck85JiRhjzjEHlXNOSuekctBJyaQTAAAQ4AAAEGAhFBqyIgCIEwAwSJKmWZomipamiaJniqrqiaKqWp5nmp5pqqpnmqpqqqrrmqrqypbnmaZnmqrqmaaqiqbquqaquq6nqrZsuqoum65q267s+rZru77uqapsm6or66bqyrrqyrbuurbtS56nqqKquq5nqq6ruq5uq65r25pqyq6purJtuq4tu7Js664s67pmqq5suqotm64s667s2rYqy7ovuq5uq7Ks+6os+75s67ru2rrwi65r66os674qy74x27bwy7ouHJMnqqqnqq7rmarrqq5r26rr2rqmmq5suq4tm6or26os67Yry7aumaosm64r26bryrIqy77vyrJui67r66Ys67oqy8Lu6roxzLat+6Lr6roqy7qvyrKuu7ru+7JuC7umqrpuyrKvm7Ks+7auC8us27oxuq7vq7It/KosC7+u+8Iy6z5jdF1fV21ZGFbZ9n3d95Vj1nVhWW1b+V1bZ7y+bgy7bvzKrQvLstq2scy6rSyvrxvDLux8W/iVmqratum6um7Ksq/Lui60dd1XRtf1fdW2fV+VZd+3hV9pG8OwjK6r+6os68Jry8ov67qw7MIvLKttK7+r68ow27qw3L6wLL/uC8uq277v6rrStXVluX2fsSu38QsAABhwAAAIMKEMFBqyIgCIEwBAEHIOKQahYgpCCKGkEEIqFWNSMuakZM5JKaWUFEpJrWJMSuaclMwxKaGUlkopqYRSWiqlxBRKaS2l1mJKqcVQSmulpNZKSa2llGJMrcUYMSYlc05K5pyUklJrJZXWMucoZQ5K6iCklEoqraTUYuacpA46Kx2E1EoqMZWUYgupxFZKaq2kFGMrMdXUWo4hpRhLSrGVlFptMdXWWqs1YkxK5pyUzDkqJaXWSiqtZc5J6iC01DkoqaTUYiopxco5SR2ElDLIqJSUWiupxBJSia20FGMpqcXUYq4pxRZDSS2WlFosqcTWYoy1tVRTJ6XFklKMJZUYW6y5ttZqDKXEVkqLsaSUW2sx1xZjjqGkFksrsZWUWmy15dhayzW1VGNKrdYWY40x5ZRrrT2n1mJNMdXaWqy51ZZbzLXnTkprpZQWS0oxttZijTHmHEppraQUWykpxtZara3FXEMpsZXSWiypxNhirLXFVmNqrcYWW62ltVprrb3GVlsurdXcYqw9tZRrrLXmWFNtBQAADDgAAASYUAYKDVkJAEQBAADGMMYYhEYpx5yT0ijlnHNSKucghJBS5hyEEFLKnINQSkuZcxBKSSmUklJqrYVSUmqttQIAAAocAAACbNCUWByg0JCVAEAqAIDBcTRNFFXVdX1fsSxRVFXXlW3jVyxNFFVVdm1b+DVRVFXXtW3bFn5NFFVVdmXZtoWiqrqybduybgvDqKqua9uybeuorqvbuq3bui9UXVmWbVu3dR3XtnXd9nVd+Bmzbeu2buu+8CMMR9/4IeTj+3RCCAAAT3AAACqwYXWEk6KxwEJDVgIAGQAAgDFKGYUYM0gxphhjTDHGmAAAgAEHAIAAE8pAoSErAoAoAADAOeecc84555xzzjnnnHPOOeecc44xxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY0wAwE6EA8BOhIVQaMhKACAcAABACCEpKaWUUkoRU85BSSmllFKqFIOMSkoppZRSpBR1lFJKKaWUIqWgpJJSSimllElJKaWUUkoppYw6SimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaVUSimllFJKKaWUUkoppRQAYPLgAACVYOMMK0lnhaPBhYasBAByAwAAhRiDEEJpraRUUkolVc5BKCWUlEpKKZWUUqqYgxBKKqmlklJKKbXSQSihlFBKKSWUUkooJYQQSgmhlFRCK6mEUkoHoYQSQimhhFRKKSWUzkEoIYUOQkmllNRCSB10VFIpIZVSSiklpZQ6CKGUklJLLZVSWkqpdBJSKamV1FJqqbWSUgmhpFZKSSWl0lpJJbUSSkklpZRSSymFVFJJJYSSUioltZZaSqm11lJIqZWUUkqppdRSSiWlkEpKqZSSUmollZRSaiGVlEpJKaTUSimlpFRCSamlUlpKLbWUSkmptFRSSaWUlEpJKaVSSksppRJKSqmllFpJKYWSUkoplZJSSyW1VEoKJaWUUkmptJRSSymVklIBAEAHDgAAAUZUWoidZlx5BI4oZJiAAgAAQABAgAkgMEBQMApBgDACAQAAAADAAAAfAABHARAR0ZzBAUKCwgJDg8MDAAAAAAAAAAAAAACAT2dnUwAEAAAAAAAAAADqnjMlAgAAADzQPmcBAQA=");
        }
        if (mpeg) {
            canPlayThrough("audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
        }
        /// lets find out!
        var time = (new Date()).getTime();
        var interval = window.setInterval(function () {
            var now = (new Date()).getTime();
            var maxExecution = now - time > 5000;
            if (!pending || maxExecution) {
                window.clearInterval(interval);
                onsuccess(supports);
            }
        }, 1);
    };
    exports["default"] = audioDetect;
});
define("js/midi/gm", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    /*
        ----------------------------------------------------------
        GeneralMIDI
        ----------------------------------------------------------
    */
    var clean = function (name) {
        return name.replace(/[^a-z0-9 ]/gi, "").replace(/[ ]/g, "_").toLowerCase();
    };
    var arr = {
        // tslint:disable:object-literal-sort-keys
        "Piano": [
            "1 Acoustic Grand Piano",
            "2 Bright Acoustic Piano",
            "3 Electric Grand Piano",
            "4 Honky-tonk Piano",
            "5 Electric Piano 1",
            "6 Electric Piano 2",
            "7 Harpsichord",
            "8 Clavinet",
        ],
        "Chromatic Percussion": [
            "9 Celesta",
            "10 Glockenspiel",
            "11 Music Box",
            "12 Vibraphone",
            "13 Marimba",
            "14 Xylophone",
            "15 Tubular Bells",
            "16 Dulcimer",
        ],
        "Organ": [
            "17 Drawbar Organ",
            "18 Percussive Organ",
            "19 Rock Organ",
            "20 Church Organ",
            "21 Reed Organ",
            "22 Accordion",
            "23 Harmonica",
            "24 Tango Accordion",
        ],
        "Guitar": [
            "25 Acoustic Guitar (nylon)",
            "26 Acoustic Guitar (steel)",
            "27 Electric Guitar (jazz)",
            "28 Electric Guitar (clean)",
            "29 Electric Guitar (muted)",
            "30 Overdriven Guitar",
            "31 Distortion Guitar",
            "32 Guitar Harmonics",
        ],
        "Bass": [
            "33 Acoustic Bass",
            "34 Electric Bass (finger)",
            "35 Electric Bass (pick)",
            "36 Fretless Bass",
            "37 Slap Bass 1",
            "38 Slap Bass 2",
            "39 Synth Bass 1",
            "40 Synth Bass 2",
        ],
        "Strings": [
            "41 Violin",
            "42 Viola",
            "43 Cello",
            "44 Contrabass",
            "45 Tremolo Strings",
            "46 Pizzicato Strings",
            "47 Orchestral Harp",
            "48 Timpani",
        ],
        "Ensemble": [
            "49 String Ensemble 1",
            "50 String Ensemble 2",
            "51 Synth Strings 1",
            "52 Synth Strings 2",
            "53 Choir Aahs",
            "54 Voice Oohs",
            "55 Synth Choir",
            "56 Orchestra Hit",
        ],
        "Brass": [
            "57 Trumpet",
            "58 Trombone",
            "59 Tuba",
            "60 Muted Trumpet",
            "61 French Horn",
            "62 Brass Section",
            "63 Synth Brass 1",
            "64 Synth Brass 2",
        ],
        "Reed": [
            "65 Soprano Sax",
            "66 Alto Sax",
            "67 Tenor Sax",
            "68 Baritone Sax",
            "69 Oboe",
            "70 English Horn",
            "71 Bassoon",
            "72 Clarinet",
        ],
        "Pipe": [
            "73 Piccolo",
            "74 Flute",
            "75 Recorder",
            "76 Pan Flute",
            "77 Blown Bottle",
            "78 Shakuhachi",
            "79 Whistle",
            "80 Ocarina",
        ],
        "Synth Lead": [
            "81 Lead 1 (square)",
            "82 Lead 2 (sawtooth)",
            "83 Lead 3 (calliope)",
            "84 Lead 4 (chiff)",
            "85 Lead 5 (charang)",
            "86 Lead 6 (voice)",
            "87 Lead 7 (fifths)",
            "88 Lead 8 (bass + lead)",
        ],
        "Synth Pad": [
            "89 Pad 1 (new age)",
            "90 Pad 2 (warm)",
            "91 Pad 3 (polysynth)",
            "92 Pad 4 (choir)",
            "93 Pad 5 (bowed)",
            "94 Pad 6 (metallic)",
            "95 Pad 7 (halo)",
            "96 Pad 8 (sweep)",
        ],
        "Synth Effects": [
            "97 FX 1 (rain)",
            "98 FX 2 (soundtrack)",
            "99 FX 3 (crystal)",
            "100 FX 4 (atmosphere)",
            "101 FX 5 (brightness)",
            "102 FX 6 (goblins)",
            "103 FX 7 (echoes)",
            "104 FX 8 (sci-fi)",
        ],
        "Ethnic": [
            "105 Sitar",
            "106 Banjo",
            "107 Shamisen",
            "108 Koto",
            "109 Kalimba",
            "110 Bagpipe",
            "111 Fiddle",
            "112 Shanai",
        ],
        "Percussive": [
            "113 Tinkle Bell",
            "114 Agogo",
            "115 Steel Drums",
            "116 Woodblock",
            "117 Taiko Drum",
            "118 Melodic Tom",
            "119 Synth Drum",
        ],
        "Sound effects": [
            "120 Reverse Cymbal",
            "121 Guitar Fret Noise",
            "122 Breath Noise",
            "123 Seashore",
            "124 Bird Tweet",
            "125 Telephone Ring",
            "126 Helicopter",
            "127 Applause",
            "128 Gunshot",
        ]
    };
    var channels = {};
    for (var i = 0; i < 16; i++) {
        channels[i] = {
            instrument: i,
            mono: false,
            mute: false,
            omni: false,
            pitchBend: 0,
            solo: false
        };
    }
    var GM = {
        byCategory: {},
        byId: {},
        byName: {},
        channels: channels,
        /* note conversions
        --------------------------------------------------- */
        keyToNote: {},
        noteToKey: {},
        /* get/setInstrument
        --------------------------------------------------- */
        getInstrument: function (channelId) {
            var channel = GM.channels[channelId];
            return channel && channel.instrument;
        },
        setInstrument: function (channelId, program, delay) {
            var channel = GM.channels[channelId];
            if (delay) {
                return setTimeout(function () {
                    channel.instrument = program;
                }, delay);
            }
            else {
                channel.instrument = program;
            }
        },
        /* get/setMono
        --------------------------------------------------- */
        getMono: function (channelId) {
            var channel = GM.channels[channelId];
            return channel && channel.mono;
        },
        setMono: function (channelId, truthy, delay) {
            var channel = GM.channels[channelId];
            if (delay) {
                return setTimeout(function () {
                    channel.mono = truthy;
                }, delay);
            }
            else {
                channel.mono = truthy;
            }
        },
        /* get/setOmni
        --------------------------------------------------- */
        getOmni: function (channelId) {
            var channel = GM.channels[channelId];
            return channel && channel.omni;
        },
        setOmni: function (channelId, truthy, delay) {
            var channel = GM.channels[channelId];
            if (delay) {
                return setTimeout(function () {
                    channel.omni = truthy;
                }, delay);
            }
            else {
                channel.omni = truthy;
            }
        },
        /* get/setSolo
        --------------------------------------------------- */
        getSolo: function (channelId) {
            var channel = GM.channels[channelId];
            return channel && channel.solo;
        },
        setSolo: function (channelId, truthy, delay) {
            var channel = GM.channels[channelId];
            if (delay) {
                return setTimeout(function () {
                    channel.solo = truthy;
                }, delay);
            }
            else {
                channel.solo = truthy;
            }
        }
    };
    for (var key in arr) {
        if (!Object.prototype.hasOwnProperty.call(arr, key)) {
            continue;
        }
        var list = arr[key];
        for (var n = 0, length_1 = list.length; n < length_1; n++) {
            var instrument = list[n];
            if (!instrument) {
                continue;
            }
            var num = parseInt(instrument.substr(0, instrument.indexOf(" ")), 10);
            instrument = instrument.replace(num + " ", "");
            GM.byId[--num] =
                GM.byName[clean(instrument)] =
                    GM.byCategory[clean(key)] = {
                        category: key,
                        id: clean(instrument),
                        instrument: instrument,
                        number: num
                    };
        }
    }
    var A0 = 0x15; // first note
    var C8 = 0x6C; // last note
    var number2key = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    for (var n = A0; n <= C8; n++) {
        // tslint:disable-next-line:no-bitwise
        var octave = (n - 12) / 12 >> 0;
        var name_1 = number2key[n % 12] + octave;
        GM.keyToNote[name_1] = n;
        GM.noteToKey[n] = name_1;
    }
    exports["default"] = GM;
});
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
define("js/util/dom_request_script", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var globalExists = function (path, root) {
        if (root === void 0) { root = window; }
        try {
            path = path.split('"').join("").split("'").join("").split("]").join("").split("[").join(".");
            var parts = path.split(".");
            var length_2 = parts.length;
            for (var n = 0; n < length_2; n++) {
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
define("js/util/dom_request_xhr", ["require", "exports"], function (require, exports) {
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
/*
  ----------------------------------------------------------------------
  Web MIDI API - Native Soundbanks
  ----------------------------------------------------------------------
  http://webaudio.github.io/web-midi-api/
  ----------------------------------------------------------------------
*/
define("js/midi/plugin.webmidi", ["require", "exports", "js/midi/loader"], function (require, exports, loader_1) {
    "use strict";
    exports.__esModule = true;
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
define("js/midi/loader", ["require", "exports", "js/util/dom_request_script", "js/util/dom_request_xhr", "js/midi/audioDetect", "js/midi/gm", "js/midi/plugin.webmidi"], function (require, exports, dom_request_script_1, dom_request_xhr_1, audioDetect_1, gm_1, plugin_webmidi_1) {
    "use strict";
    exports.__esModule = true;
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
});
define("inc/jasmid/stream", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    /* Wrapper for accessing strings through sequential reads */
    function Stream(str) {
        var position = 0;
        function read(length) {
            var result = str.substr(position, length);
            position += length;
            return result;
        }
        /* read a big-endian 32-bit integer */
        function readInt32() {
            var result = (
            // tslint:disable-next-line:no-bitwise
            (str.charCodeAt(position) << 24)
                // tslint:disable-next-line:no-bitwise
                + (str.charCodeAt(position + 1) << 16)
                // tslint:disable-next-line:no-bitwise
                + (str.charCodeAt(position + 2) << 8)
                + str.charCodeAt(position + 3));
            position += 4;
            return result;
        }
        /* read a big-endian 16-bit integer */
        function readInt16() {
            var result = (
            // tslint:disable-next-line:no-bitwise
            (str.charCodeAt(position) << 8)
                + str.charCodeAt(position + 1));
            position += 2;
            return result;
        }
        /* read an 8-bit integer */
        function readInt8(signed) {
            if (signed === void 0) { signed = false; }
            var result = str.charCodeAt(position);
            if (signed && result > 127) {
                result -= 256;
            }
            position += 1;
            return result;
        }
        function eof() {
            return position >= str.length;
        }
        /* read a MIDI-style variable-length integer
          (big-endian value in groups of 7 bits,
          with top bit set to signify that another byte follows)
        */
        function readVarInt() {
            var result = 0;
            while (true) {
                var b = readInt8();
                // tslint:disable-next-line:no-bitwise
                if (b & 0x80) {
                    // tslint:disable-next-line:no-bitwise
                    result += (b & 0x7f);
                    // tslint:disable-next-line:no-bitwise
                    result <<= 7;
                }
                else {
                    /* b is the last byte */
                    return result + b;
                }
            }
        }
        return {
            eof: eof,
            read: read,
            readInt16: readInt16,
            readInt32: readInt32,
            readInt8: readInt8,
            readVarInt: readVarInt
        };
    }
    exports["default"] = Stream;
});
/*
class to parse the .mid file format
(depends on stream.js)
*/
define("inc/jasmid/midifile", ["require", "exports", "inc/jasmid/stream"], function (require, exports, stream_1) {
    "use strict";
    exports.__esModule = true;
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
                    var length_3 = stream.readVarInt();
                    switch (subtypeByte) {
                        case 0x00:
                            event.subtype = "sequenceNumber";
                            if (length_3 !== 2) {
                                throw new Error("Expected length for sequenceNumber event is 2, got " + length_3);
                            }
                            event.number = stream.readInt16();
                            return event;
                        case 0x01:
                            event.subtype = "text";
                            event.text = stream.read(length_3);
                            return event;
                        case 0x02:
                            event.subtype = "copyrightNotice";
                            event.text = stream.read(length_3);
                            return event;
                        case 0x03:
                            event.subtype = "trackName";
                            event.text = stream.read(length_3);
                            return event;
                        case 0x04:
                            event.subtype = "instrumentName";
                            event.text = stream.read(length_3);
                            return event;
                        case 0x05:
                            event.subtype = "lyrics";
                            event.text = stream.read(length_3);
                            return event;
                        case 0x06:
                            event.subtype = "marker";
                            event.text = stream.read(length_3);
                            return event;
                        case 0x07:
                            event.subtype = "cuePoint";
                            event.text = stream.read(length_3);
                            return event;
                        case 0x20:
                            event.subtype = "midiChannelPrefix";
                            if (length_3 !== 1) {
                                throw new Error("Expected length for midiChannelPrefix event is 1, got " + length_3);
                            }
                            event.channel = stream.readInt8();
                            return event;
                        case 0x2f:
                            event.subtype = "endOfTrack";
                            if (length_3 !== 0) {
                                throw new Error("Expected length for endOfTrack event is 0, got " + length_3);
                            }
                            return event;
                        case 0x51:
                            event.subtype = "setTempo";
                            if (length_3 !== 3) {
                                throw new Error("Expected length for setTempo event is 3, got " + length_3);
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
                            if (length_3 !== 5) {
                                throw new Error("Expected length for smpteOffset event is 5, got " + length_3);
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
                            if (length_3 !== 4) {
                                throw new Error("Expected length for timeSignature event is 4, got " + length_3);
                            }
                            event.numerator = stream.readInt8();
                            event.denominator = Math.pow(2, stream.readInt8());
                            event.metronome = stream.readInt8();
                            event.thirtyseconds = stream.readInt8();
                            return event;
                        case 0x59:
                            event.subtype = "keySignature";
                            if (length_3 !== 2) {
                                throw new Error("Expected length for keySignature event is 2, got " + length_3);
                            }
                            event.key = stream.readInt8(true);
                            event.scale = stream.readInt8();
                            return event;
                        case 0x7f:
                            event.subtype = "sequencerSpecific";
                            event.data = stream.read(length_3);
                            return event;
                        default:
                            // console.log("Unrecognised meta event subtype: " + subtypeByte);
                            event.subtype = "unknown";
                            event.data = stream.read(length_3);
                            return event;
                    }
                    event.data = stream.read(length_3);
                    return event;
                }
                else if (eventTypeByte === 0xf0) {
                    event.type = "sysEx";
                    var length_4 = stream.readVarInt();
                    event.data = stream.read(length_4);
                    return event;
                }
                else if (eventTypeByte === 0xf7) {
                    event.type = "dividedSysEx";
                    var length_5 = stream.readVarInt();
                    event.data = stream.read(length_5);
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
define("inc/jasmid/replayer", ["require", "exports"], function (require, exports) {
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
/**
 * @license -------------------------------------------------------------------
 *   module: Base64Binary
 *      src: http://blog.danguer.com/2011/10/24/base64-binary-decoding-in-javascript/
 *  license: Simplified BSD License
 * -------------------------------------------------------------------
 * Copyright 2011, Daniel Guerrero. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     - Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     - Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
define("inc/shim/Base64binary", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var KEY_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    // tslint:disable-next-line:variable-name
    var Base64Binary = {
        /* will return a  Uint8Array type */
        decodeArrayBuffer: function (input) {
            var bytes = Math.ceil((3 * input.length) / 4.0);
            var ab = new ArrayBuffer(bytes);
            return this.decode(input, ab);
        },
        decode: function (input, arrayBuffer) {
            // get last chars to see if are valid
            var lkey1 = KEY_STRING.indexOf(input.charAt(input.length - 1));
            var lkey2 = KEY_STRING.indexOf(input.charAt(input.length - 1));
            var bytes = Math.ceil((3 * input.length) / 4.0);
            if (lkey1 === 64) {
                bytes--; // padding chars, so skip
            }
            if (lkey2 === 64) {
                bytes--; // padding chars, so skip
            }
            var uarray;
            var i = 0;
            var j = 0;
            if (arrayBuffer) {
                uarray = new Uint8Array(arrayBuffer);
            }
            else {
                uarray = new Uint8Array(bytes);
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            for (i = 0; i < bytes; i += 3) {
                // get the 3 octects in 4 ascii chars
                var enc1 = this._keyStr.indexOf(input.charAt(j++));
                var enc2 = this._keyStr.indexOf(input.charAt(j++));
                var enc3 = this._keyStr.indexOf(input.charAt(j++));
                var enc4 = this._keyStr.indexOf(input.charAt(j++));
                // tslint:disable-next-line:no-bitwise
                var chr1 = (enc1 << 2) | (enc2 >> 4);
                // tslint:disable-next-line:no-bitwise
                var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                // tslint:disable-next-line:no-bitwise
                var chr3 = ((enc3 & 3) << 6) | enc4;
                uarray[i] = chr1;
                if (enc3 !== 64) {
                    uarray[i + 1] = chr2;
                }
                if (enc4 !== 64) {
                    uarray[i + 2] = chr3;
                }
            }
            return uarray;
        }
    };
    exports["default"] = Base64Binary;
});
/*
  ----------------------------------------------------------
  Web Audio API - OGG or MPEG Soundbank
  ----------------------------------------------------------
  http://webaudio.github.io/web-audio-api/
  ----------------------------------------------------------
*/
define("js/midi/plugin.webaudio", ["require", "exports", "tunajs", "inc/shim/Base64binary", "js/midi/gm", "js/midi/loader"], function (require, exports, tunajs_1, Base64binary_1, gm_2, loader_2) {
    "use strict";
    exports.__esModule = true;
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
            var channel = gm_2["default"].channels[channelId];
            channel.instrument = program;
        };
        WebAudio.prototype.pitchBend = function (channelId, program) {
            var channel = gm_2["default"].channels[channelId];
            channel.pitchBend = program;
        };
        WebAudio.prototype.noteOn = function (channelId, noteId, velocity, delay) {
            delay = delay || 0;
            /// check whether the note exists
            var channel = gm_2["default"].channels[channelId];
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
            var channel = gm_2["default"].channels[channelId];
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
            loader_2["default"].setDefaultPlugin(this);
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
            var notes = gm_2["default"].keyToNote;
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
                        var noteId = gm_2["default"].keyToNote[key];
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
                var synth = gm_2["default"].byName[instrument];
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
});
/*
  ----------------------------------------------------------
  MIDI.Player : 0.3.1 : 2015-03-26
  ----------------------------------------------------------
  https://github.com/mudcube/MIDI.js
  ----------------------------------------------------------
*/
define("js/midi/player", ["require", "exports", "inc/jasmid/midifile", "inc/jasmid/replayer", "js/midi/gm", "js/midi/loader", "js/midi/plugin.webaudio"], function (require, exports, midifile_1, replayer_1, gm_3, loader_3, plugin_webaudio_1) {
    "use strict";
    exports.__esModule = true;
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
                loader_3["default"].loadPlugin({
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
                var event_2 = dataItem[0].event;
                if (event_2.type !== "channel") {
                    continue;
                }
                var channel = event_2.channel;
                switch (event_2.subtype) {
                    case "controller":
                        break;
                    case "programChange":
                        programs[channel] = event_2.programNumber;
                        break;
                    case "noteOn":
                        var program = programs[channel];
                        var gm = gm_3["default"].byId[isFinite(program) ? program : channel];
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
        if (loader_3["default"].defaultPlugin.api === "webaudio") {
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
        if (loader_3["default"].defaultPlugin.api !== "webaudio") { // set currentTime on ctx
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
            var event_3 = obj[0].event;
            if (event_3.type !== "channel") {
                continue;
            }
            var channelId = event_3.channel;
            var channel = gm_3["default"].channels[channelId];
            var delay = ctx.currentTime + ((currentTime + foffset + Player.startDelay) / 1000);
            var queueTime = queuedTime - offset + Player.startDelay;
            switch (event_3.subtype) {
                case "controller":
                    loader_3["default"].defaultPlugin.setController(channelId, event_3.controllerType, event_3.value, delay);
                    break;
                case "programChange":
                    loader_3["default"].defaultPlugin.programChange(channelId, event_3.programNumber, delay);
                    break;
                case "pitchBend":
                    loader_3["default"].defaultPlugin.pitchBend(channelId, event_3.value, delay);
                    break;
                case "noteOn":
                    if (channel.mute) {
                        break;
                    }
                    note = event_3.noteNumber - (Player.MIDIOffset || 0);
                    eventQueue.push({
                        event: event_3,
                        interval: scheduleTracking(channelId, note, queuedTime + Player.startDelay, offset - foffset, 144, event_3.velocity),
                        source: loader_3["default"].defaultPlugin.noteOn(channelId, event_3.noteNumber, event_3.velocity, delay),
                        time: queueTime
                    });
                    messages++;
                    break;
                case "noteOff":
                    if (channel.mute) {
                        break;
                    }
                    note = event_3.noteNumber - (Player.MIDIOffset || 0);
                    eventQueue.push({
                        event: event_3,
                        interval: scheduleTracking(channelId, note, queuedTime, offset - foffset, 128, 0),
                        source: loader_3["default"].defaultPlugin.noteOff(channelId, event_3.noteNumber, delay),
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
});
define("js/midi/plugin.audiotag", ["require", "exports", "js/midi/gm", "js/midi/loader"], function (require, exports, gm_4, loader_4) {
    "use strict";
    exports.__esModule = true;
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
                gm_4["default"].channels[channel].instrument = program;
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
                var _loop_2 = function (n) {
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
                for (var _i = 0, chord_3 = chord; _i < chord_3.length; _i++) {
                    var n = chord_3[_i];
                    var state_1 = _loop_2(n);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
            };
            AudioTag.prototype.chordOff = function (channel, chord, delay) {
                var _loop_3 = function (n) {
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
                for (var _i = 0, chord_4 = chord; _i < chord_4.length; _i++) {
                    var n = chord_4[_i];
                    var state_2 = _loop_3(n);
                    if (typeof state_2 === "object")
                        return state_2.value;
                }
            };
            AudioTag.prototype.stopAllNotes = function () {
                for (var nid = 0, length_6 = this.audioBuffers.length; nid < length_6; nid++) {
                    this.audioBuffers[nid].pause();
                }
            };
            AudioTag.prototype.connect = function (opts) {
                loader_4["default"].setDefaultPlugin(this);
                for (var key in gm_4["default"].keyToNote) {
                    if (!Object.prototype.hasOwnProperty.call(gm_4["default"].keyToNote, key)) {
                        continue;
                    }
                    this.noteToKey[gm_4["default"].keyToNote[key]] = key;
                    this.notes[key] = { id: key };
                }
                if (opts.onsuccess) {
                    opts.onsuccess();
                }
            };
            AudioTag.prototype.playChannel = function (channel, note) {
                if (!gm_4["default"].channels[channel]) {
                    return;
                }
                var instrument = gm_4["default"].channels[channel].instrument;
                var instrumentId = gm_4["default"].byId[instrument].id;
                note = this.notes[note];
                if (note) {
                    var instrumentNoteId = instrumentId + "" + note.id;
                    var nid = (this.buffer_nid + 1) % this.audioBuffers.length;
                    var audio = this.audioBuffers[nid];
                    this.notesOn[nid] = instrumentNoteId;
                    if (!global.Soundfont[instrumentId]) {
                        if (loader_4["default"].DEBUG) {
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
                if (!gm_4["default"].channels[channel]) {
                    return;
                }
                var instrument = gm_4["default"].channels[channel].instrument;
                var instrumentId = gm_4["default"].byId[instrument].id;
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
/*
  ----------------------------------------------------------
  Color Space : 1.2 : 2012.11.06
  ----------------------------------------------------------
  https://github.com/mudcube/Color.Space.js
  ----------------------------------------------------------
  RGBA <-> HSLA  <-> W3
  RGBA <-> HSVA
  RGBA <-> CMY   <-> CMYK
  RGBA <-> HEX24 <-> W3
  RGBA <-> HEX32
  RGBA <-> W3
  ----------------------------------------------------------
  Examples
  ----------------------------------------------------------
  Color.Space(0x99ff0000, "HEX32>RGBA>HSLA>W3"); // outputs "hsla(60,100%,17%,0.6)"
  Color.Space(0xFF0000, "HEX24>RGB>HSL"); // convert hex24 to HSL object.
  ----------------------------------------------------------
  W3 values
  ----------------------------------------------------------
  rgb(255,0,0)
  rgba(255,0,0,1)
  rgb(100%,0%,0%)
  rgba(100%,0%,0%,1)
  hsl(120, 100%, 50%)
  hsla(120, 100%, 50%, 1)
  #000000
  ----------------------------------------------------------
*/
define("inc/colorspace", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var useEval = false; // caches functions for quicker access.
    var functions = {
    // holds generated cached conversion functions.
    };
    var shortcuts = {
        "HEX24>CMYK": "HEX24>RGB>CMY>CMYK",
        "HEX24>HSL": "HEX24>RGB>HSL",
        "HEX32>HSLA": "HEX32>RGBA>HSLA",
        "RGB>CMYK": "RGB>CMY>CMYK"
    };
    // tslint:disable-next-line:variable-name
    var ColorSpace = function (color, route) {
        if (shortcuts[route]) { // shortcut available
            route = shortcuts[route];
        }
        var r = route.split(">");
        // check whether color is an [], if so, convert to {}
        if (typeof color === "object" && color[0] >= 0) { // array
            var type = r[0];
            var tmp = {};
            for (var i = 0; i < type.length; i++) {
                var str = type.substr(i, 1);
                tmp[str] = color[i];
            }
            color = tmp;
        }
        if (functions[route]) { // cached function available
            return functions[route](color);
        }
        var f = "color";
        for (var pos = 1, key = r[0]; pos < r.length; pos++) {
            if (pos > 1) { // recycle previous
                key = key.substr(key.indexOf("_") + 1);
            }
            key += (pos === 0 ? "" : "_") + r[pos];
            color = ColorSpace[key](color);
            if (useEval) {
                f = "ColorSpace." + key + "(" + f + ")";
            }
        }
        if (useEval) {
            // tslint:disable-next-line:no-eval
            functions[route] = eval("(function(color) { return " + f + " })");
        }
        return color;
    };
    // W3C - RGB + RGBA
    ColorSpace.RGB_W3 = function (o) {
        // tslint:disable-next-line:no-bitwise
        return "rgb(" + (o.R >> 0) + "," + (o.G >> 0) + "," + (o.B >> 0) + ")";
    };
    ColorSpace.RGBA_W3 = function (o) {
        var alpha = typeof o.A === "number" ? o.A / 255 : 1;
        // tslint:disable-next-line:no-bitwise
        return "rgba(" + (o.R >> 0) + "," + (o.G >> 0) + "," + (o.B >> 0) + "," + alpha + ")";
    };
    ColorSpace.W3_RGB = function (o) {
        o = o.substr(4, o.length - 5).split(",");
        return {
            R: parseInt(o[0], 10),
            // tslint:disable-next-line:object-literal-sort-keys
            G: parseInt(o[1], 10),
            B: parseInt(o[2], 10)
        };
    };
    ColorSpace.W3_RGBA = function (o) {
        o = o.substr(5, o.length - 6).split(",");
        return {
            R: parseInt(o[0], 10),
            // tslint:disable-next-line:object-literal-sort-keys
            G: parseInt(o[1], 10),
            B: parseInt(o[2], 10),
            A: parseFloat(o[3]) * 255
        };
    };
    // W3C - HSL + HSLA
    ColorSpace.HSL_W3 = function (o) {
        // tslint:disable-next-line:no-bitwise
        return "hsl(" + ((o.H + 0.5) >> 0) + "," + ((o.S + 0.5) >> 0) + "%," + ((o.L + 0.5) >> 0) + "%)";
    };
    ColorSpace.HSLA_W3 = function (o) {
        var alpha = typeof o.A === "number" ? o.A / 255 : 1;
        // tslint:disable-next-line:no-bitwise
        return "hsla(" + ((o.H + 0.5) >> 0) + "," + ((o.S + 0.5) >> 0) + "%," + ((o.L + 0.5) >> 0) + "%," + alpha + ")";
    };
    ColorSpace.W3_HSL = function (o) {
        o = o.substr(4, o.length - 5).split(",");
        return {
            H: parseInt(o[0], 10),
            S: parseInt(o[1], 10),
            // tslint:disable-next-line:object-literal-sort-keys
            L: parseInt(o[2], 10)
        };
    };
    ColorSpace.W3_HSLA = function (o) {
        o = o.substr(5, o.length - 6).split(",");
        return {
            H: parseInt(o[0], 10),
            S: parseInt(o[1], 10),
            // tslint:disable-next-line:object-literal-sort-keys
            L: parseInt(o[2], 10),
            A: parseFloat(o[3]) * 255
        };
    };
    // W3 HEX = "FFFFFF" | "FFFFFFFF"
    ColorSpace.W3_HEX = ColorSpace.W3_HEX24 = function (o) {
        if (o.substr(0, 1) === "#") {
            o = o.substr(1);
        }
        if (o.length === 3) {
            o = o[0] + o[0] + o[1] + o[1] + o[2] + o[2];
        }
        return parseInt("0x" + o, 16);
    };
    ColorSpace.W3_HEX32 = function (o) {
        if (o.substr(0, 1) === "#") {
            o = o.substr(1);
        }
        if (o.length === 6) {
            return parseInt("0xFF" + o, 16);
        }
        else {
            return parseInt("0x" + o, 16);
        }
    };
    // HEX = 0x000000 -> 0xFFFFFF
    ColorSpace.HEX_W3 = ColorSpace.HEX24_W3 = function (o, maxLength) {
        if (!maxLength) {
            maxLength = 6;
        }
        if (!o) {
            o = 0;
        }
        var z = o.toString(16);
        // when string is lesser than maxLength
        var n = z.length;
        while (n < maxLength) {
            z = "0" + z;
            n++;
        }
        // when string is greater than maxLength
        n = z.length;
        while (n > maxLength) {
            z = z.substr(1);
            n--;
        }
        return "#" + z;
    };
    ColorSpace.HEX32_W3 = function (o) {
        return ColorSpace.HEX_W3(o, 8);
    };
    ColorSpace.HEX_RGB =
        ColorSpace.HEX24_RGB = function (o) {
            return {
                // tslint:disable:no-bitwise
                R: (o >> 16),
                // tslint:disable-next-line:object-literal-sort-keys
                G: (o >> 8) & 0xFF,
                B: o & 0xFF
            };
        };
    // HEX32 = 0x00000000 -> 0xFFFFFFFF
    ColorSpace.HEX32_RGBA = function (o) {
        return {
            // tslint:disable:no-bitwise
            R: o >>> 16 & 0xFF,
            // tslint:disable-next-line:object-literal-sort-keys
            G: o >>> 8 & 0xFF,
            B: o & 0xFF,
            A: o >>> 24
        };
    };
    // RGBA = R: Red / G: Green / B: Blue / A: Alpha
    ColorSpace.RGBA_HEX32 = function (o) {
        // tslint:disable-next-line:no-bitwise
        return (o.A << 24 | o.R << 16 | o.G << 8 | o.B) >>> 0;
    };
    // RGB = R: Red / G: Green / B: Blue
    ColorSpace.RGB_HEX24 =
        ColorSpace.RGB_HEX = function (o) {
            if (o.R < 0) {
                o.R = 0;
            }
            if (o.G < 0) {
                o.G = 0;
            }
            if (o.B < 0) {
                o.B = 0;
            }
            if (o.R > 255) {
                o.R = 255;
            }
            if (o.G > 255) {
                o.G = 255;
            }
            if (o.B > 255) {
                o.B = 255;
            }
            // tslint:disable-next-line:no-bitwise
            return o.R << 16 | o.G << 8 | o.B;
        };
    ColorSpace.RGB_CMY = function (o) {
        return {
            C: 1 - (o.R / 255),
            M: 1 - (o.G / 255),
            Y: 1 - (o.B / 255)
        };
    };
    ColorSpace.RGBA_HSLA =
        ColorSpace.RGB_HSL = function (o) {
            var _R = o.R / 255;
            var _G = o.G / 255;
            var _B = o.B / 255;
            var min = Math.min(_R, _G, _B);
            var max = Math.max(_R, _G, _B);
            var D = max - min;
            var H;
            var S;
            var L = (max + min) / 2;
            if (D === 0) { // No chroma
                H = 0;
                S = 0;
            }
            else { // Chromatic data
                if (L < 0.5) {
                    S = D / (max + min);
                }
                else {
                    S = D / (2 - max - min);
                }
                var DR = (((max - _R) / 6) + (D / 2)) / D;
                var DG = (((max - _G) / 6) + (D / 2)) / D;
                var DB = (((max - _B) / 6) + (D / 2)) / D;
                if (_R === max) {
                    H = DB - DG;
                }
                else if (_G === max) {
                    H = (1 / 3) + DR - DB;
                }
                else if (_B === max) {
                    H = (2 / 3) + DG - DR;
                }
                if (H < 0) {
                    H += 1;
                }
                if (H > 1) {
                    H -= 1;
                }
            }
            return {
                H: H * 360,
                S: S * 100,
                // tslint:disable-next-line:object-literal-sort-keys
                L: L * 100,
                A: o.A
            };
        };
    ColorSpace.RGBA_HSVA = ColorSpace.RGB_HSV = function (o) {
        var _R = o.R / 255;
        var _G = o.G / 255;
        var _B = o.B / 255;
        var min = Math.min(_R, _G, _B);
        var max = Math.max(_R, _G, _B);
        var D = max - min;
        var H;
        var S;
        var V = max;
        if (D === 0) { // No chroma
            H = 0;
            S = 0;
        }
        else { // Chromatic data
            S = D / max;
            var DR = (((max - _R) / 6) + (D / 2)) / D;
            var DG = (((max - _G) / 6) + (D / 2)) / D;
            var DB = (((max - _B) / 6) + (D / 2)) / D;
            if (_R === max) {
                H = DB - DG;
            }
            else if (_G === max) {
                H = (1 / 3) + DR - DB;
            }
            else if (_B === max) {
                H = (2 / 3) + DG - DR;
            }
            if (H < 0) {
                H += 1;
            }
            if (H > 1) {
                H -= 1;
            }
        }
        return {
            H: H * 360,
            S: S * 100,
            V: V * 100,
            // tslint:disable-next-line:object-literal-sort-keys
            A: o.A
        };
    };
    // CMY = C: Cyan / M: Magenta / Y: Yellow
    ColorSpace.CMY_RGB = function (o) {
        return {
            R: Math.max(0, (1 - o.C) * 255),
            // tslint:disable-next-line:object-literal-sort-keys
            G: Math.max(0, (1 - o.M) * 255),
            B: Math.max(0, (1 - o.Y) * 255)
        };
    };
    ColorSpace.CMY_CMYK = function (o) {
        var C = o.C;
        var M = o.M;
        var Y = o.Y;
        var K = Math.min(Y, Math.min(M, Math.min(C, 1)));
        C = Math.round((C - K) / (1 - K) * 100);
        M = Math.round((M - K) / (1 - K) * 100);
        Y = Math.round((Y - K) / (1 - K) * 100);
        K = Math.round(K * 100);
        return {
            C: C,
            M: M,
            Y: Y,
            // tslint:disable-next-line:object-literal-sort-keys
            K: K
        };
    };
    // CMYK = C: Cyan / M: Magenta / Y: Yellow / K: Key (black)
    ColorSpace.CMYK_CMY = function (o) {
        return {
            C: (o.C * (1 - o.K) + o.K),
            M: (o.M * (1 - o.K) + o.K),
            Y: (o.Y * (1 - o.K) + o.K)
        };
    };
    // HSL (1978) = H: Hue / S: Saturation / L: Lightess
    // en.wikipedia.org/wiki/HSL_and_HSV
    ColorSpace.HSLA_RGBA = ColorSpace.HSL_RGB = function (o) {
        var H = o.H / 360;
        var S = o.S / 100;
        var L = o.L / 100;
        var R;
        var G;
        var B;
        var temp1;
        var temp2;
        var temp3;
        if (S === 0) {
            R = G = B = L;
        }
        else {
            if (L < 0.5) {
                temp2 = L * (1 + S);
            }
            else {
                temp2 = (L + S) - (S * L);
            }
            temp1 = 2 * L - temp2;
            // calculate red
            temp3 = H + (1 / 3);
            if (temp3 < 0) {
                temp3 += 1;
            }
            if (temp3 > 1) {
                temp3 -= 1;
            }
            if ((6 * temp3) < 1) {
                R = temp1 + (temp2 - temp1) * 6 * temp3;
            }
            else if ((2 * temp3) < 1) {
                R = temp2;
            }
            else if ((3 * temp3) < 2) {
                R = temp1 + (temp2 - temp1) * ((2 / 3) - temp3) * 6;
            }
            else {
                R = temp1;
            }
            // calculate green
            temp3 = H;
            if (temp3 < 0) {
                temp3 += 1;
            }
            if (temp3 > 1) {
                temp3 -= 1;
            }
            if ((6 * temp3) < 1) {
                G = temp1 + (temp2 - temp1) * 6 * temp3;
            }
            else if ((2 * temp3) < 1) {
                G = temp2;
            }
            else if ((3 * temp3) < 2) {
                G = temp1 + (temp2 - temp1) * ((2 / 3) - temp3) * 6;
            }
            else {
                G = temp1;
            }
            // calculate blue
            temp3 = H - (1 / 3);
            if (temp3 < 0) {
                temp3 += 1;
            }
            if (temp3 > 1) {
                temp3 -= 1;
            }
            if ((6 * temp3) < 1) {
                B = temp1 + (temp2 - temp1) * 6 * temp3;
            }
            else if ((2 * temp3) < 1) {
                B = temp2;
            }
            else if ((3 * temp3) < 2) {
                B = temp1 + (temp2 - temp1) * ((2 / 3) - temp3) * 6;
            }
            else {
                B = temp1;
            }
        }
        return {
            R: R * 255,
            // tslint:disable-next-line:object-literal-sort-keys
            G: G * 255,
            B: B * 255,
            A: o.A
        };
    };
    // HSV (1978) = H: Hue / S: Saturation / V: Value
    // en.wikipedia.org/wiki/HSL_and_HSV
    ColorSpace.HSVA_RGBA = ColorSpace.HSV_RGB = function (o) {
        var H = o.H / 360;
        var S = o.S / 100;
        var V = o.V / 100;
        var R;
        var G;
        var B;
        var D;
        var A;
        var C;
        if (S === 0) {
            R = G = B = Math.round(V * 255);
        }
        else {
            if (H >= 1) {
                H = 0;
            }
            H = 6 * H;
            D = H - Math.floor(H);
            A = Math.round(255 * V * (1 - S));
            B = Math.round(255 * V * (1 - (S * D)));
            C = Math.round(255 * V * (1 - (S * (1 - D))));
            V = Math.round(255 * V);
            switch (Math.floor(H)) {
                case 0:
                    R = V;
                    G = C;
                    B = A;
                    break;
                case 1:
                    R = B;
                    G = V;
                    B = A;
                    break;
                case 2:
                    R = A;
                    G = V;
                    B = C;
                    break;
                case 3:
                    R = A;
                    G = B;
                    B = V;
                    break;
                case 4:
                    R = C;
                    G = A;
                    B = V;
                    break;
                case 5:
                    R = V;
                    G = A;
                    B = B;
                    break;
            }
        }
        return {
            R: R,
            // tslint:disable-next-line:object-literal-sort-keys
            G: G,
            B: B,
            A: o.A
        };
    };
    exports["default"] = ColorSpace;
});
/*
  ----------------------------------------------------------
  MIDI.Synesthesia : 0.3.1 : 2012-01-06
  ----------------------------------------------------------
  Peacock:  “Instruments to perform color-music: Two centuries of technological experimentation,”
    Leonardo, 21 (1988), 397-406.
  Gerstner:  Karl Gerstner, The Forms of Color 1986
  Klein:  Colour-Music: The art of light, London: Crosby Lockwood and Son, 1927.
  Jameson:  “Visual music in a visual programming language,” IEEE Symposium on Visual Languages, 1999, 111-118.
  Helmholtz:  Treatise on Physiological Optics, New York: Dover Books, 1962
  Jones:  The art of light & color, New York: Van Nostrand Reinhold, 1972
  ----------------------------------------------------------
  Reference: http://rhythmiclight.com/archives/ideas/colorscales.html
  ----------------------------------------------------------
*/
define("js/midi/synesthesia", ["require", "exports", "inc/colorspace"], function (require, exports, colorspace_1) {
    "use strict";
    exports.__esModule = true;
    // tslint:disable-next-line:variable-name
    var Synesthesia = {
        // tslint:disable:object-literal-sort-keys
        data: {
            "Isaac Newton (1704)": {
                english: [
                    "red",
                    null,
                    "orange",
                    null,
                    "yellow",
                    "green",
                    null,
                    "blue",
                    null,
                    "indigo",
                    null,
                    "violet",
                ],
                format: "HSL",
                ref: "Gerstner, p.167",
                0: [0, 96, 51],
                1: [0, 0, 0],
                2: [29, 94, 52],
                3: [0, 0, 0],
                4: [60, 90, 60],
                5: [135, 76, 32],
                6: [0, 0, 0],
                7: [248, 82, 28],
                8: [0, 0, 0],
                9: [302, 88, 26],
                10: [0, 0, 0],
                11: [325, 84, 46]
            },
            "Louis Bertrand Castel (1734)": {
                english: [
                    "blue",
                    "blue-green",
                    "green",
                    "olive green",
                    "yellow",
                    "yellow-orange",
                    "orange",
                    "red",
                    "crimson",
                    "violet",
                    "agate",
                    "indigo",
                ],
                format: "HSL",
                ref: "Peacock, p.400",
                0: [248, 82, 28],
                1: [172, 68, 34],
                2: [135, 76, 32],
                3: [79, 59, 36],
                4: [60, 90, 60],
                5: [49, 90, 60],
                6: [29, 94, 52],
                7: [360, 96, 51],
                8: [1, 89, 33],
                9: [325, 84, 46],
                10: [273, 80, 27],
                11: [302, 88, 26]
            },
            "George Field (1816)": {
                english: [
                    "blue",
                    null,
                    "purple",
                    null,
                    "red",
                    "orange",
                    null,
                    "yellow",
                    null,
                    "yellow green",
                    null,
                    "green",
                ],
                format: "HSL",
                ref: "Klein, p.69",
                0: [248, 82, 28],
                1: [0, 0, 0],
                2: [302, 88, 26],
                3: [0, 0, 0],
                4: [360, 96, 51],
                5: [29, 94, 52],
                6: [0, 0, 0],
                7: [60, 90, 60],
                8: [0, 0, 0],
                9: [79, 59, 36],
                10: [0, 0, 0],
                11: [135, 76, 32]
            },
            "D. D. Jameson (1844)": {
                english: [
                    "red",
                    "red-orange",
                    "orange",
                    "orange-yellow",
                    "yellow",
                    "green",
                    "green-blue",
                    "blue",
                    "blue-purple",
                    "purple",
                    "purple-violet",
                    "violet",
                ],
                format: "HSL",
                ref: "Jameson, p.12",
                0: [360, 96, 51],
                1: [14, 91, 51],
                2: [29, 94, 52],
                3: [49, 90, 60],
                4: [60, 90, 60],
                5: [135, 76, 32],
                6: [172, 68, 34],
                7: [248, 82, 28],
                8: [273, 80, 27],
                9: [302, 88, 26],
                10: [313, 78, 37],
                11: [325, 84, 46]
            },
            "Theodor Seemann (1881)": {
                english: [
                    "carmine",
                    "scarlet",
                    "orange",
                    "yellow-orange",
                    "yellow",
                    "green",
                    "green blue",
                    "blue",
                    "indigo",
                    "violet",
                    "brown",
                    "black",
                ],
                format: "HSL",
                ref: "Klein, p.86",
                0: [0, 58, 26],
                1: [360, 96, 51],
                2: [29, 94, 52],
                3: [49, 90, 60],
                4: [60, 90, 60],
                5: [135, 76, 32],
                6: [172, 68, 34],
                7: [248, 82, 28],
                8: [302, 88, 26],
                9: [325, 84, 46],
                10: [0, 58, 26],
                11: [0, 0, 3]
            },
            "A. Wallace Rimington (1893)": {
                english: [
                    "deep red",
                    "crimson",
                    "orange-crimson",
                    "orange",
                    "yellow",
                    "yellow-green",
                    "green",
                    "blueish green",
                    "blue-green",
                    "indigo",
                    "deep blue",
                    "violet",
                ],
                format: "HSL",
                ref: "Peacock, p.402",
                0: [360, 96, 51],
                1: [1, 89, 33],
                2: [14, 91, 51],
                3: [29, 94, 52],
                4: [60, 90, 60],
                5: [79, 59, 36],
                6: [135, 76, 32],
                7: [163, 62, 40],
                8: [172, 68, 34],
                9: [302, 88, 26],
                10: [248, 82, 28],
                11: [325, 84, 46]
            },
            "Bainbridge Bishop (1893)": {
                english: [
                    "red",
                    "orange-red or scarlet",
                    "orange",
                    "gold or yellow-orange",
                    "yellow or green-gold",
                    "yellow-green",
                    "green",
                    "greenish-blue or aquamarine",
                    "blue",
                    "indigo or violet-blue",
                    "violet",
                    "violet-red",
                    "red",
                ],
                format: "HSL",
                ref: "Bishop, p.11",
                0: [360, 96, 51],
                1: [1, 89, 33],
                2: [29, 94, 52],
                3: [50, 93, 52],
                4: [60, 90, 60],
                5: [73, 73, 55],
                6: [135, 76, 32],
                7: [163, 62, 40],
                8: [302, 88, 26],
                9: [325, 84, 46],
                10: [343, 79, 47],
                11: [360, 96, 51]
            },
            "H. von Helmholtz (1910)": {
                english: [
                    "yellow",
                    "green",
                    "greenish blue",
                    "cayan-blue",
                    "indigo blue",
                    "violet",
                    "end of red",
                    "red",
                    "red",
                    "red",
                    "red orange",
                    "orange",
                ],
                format: "HSL",
                ref: "Helmholtz, p.22",
                0: [60, 90, 60],
                1: [135, 76, 32],
                2: [172, 68, 34],
                3: [211, 70, 37],
                4: [302, 88, 26],
                5: [325, 84, 46],
                6: [330, 84, 34],
                7: [360, 96, 51],
                8: [10, 91, 43],
                9: [10, 91, 43],
                10: [8, 93, 51],
                11: [28, 89, 50]
            },
            "Alexander Scriabin (1911)": {
                english: [
                    "red",
                    "violet",
                    "yellow",
                    "steely with the glint of metal",
                    "pearly blue the shimmer of moonshine",
                    "dark red",
                    "bright blue",
                    "rosy orange",
                    "purple",
                    "green",
                    "steely with a glint of metal",
                    "pearly blue the shimmer of moonshine",
                ],
                format: "HSL",
                ref: "Jones, p.104",
                0: [360, 96, 51],
                1: [325, 84, 46],
                2: [60, 90, 60],
                3: [245, 21, 43],
                4: [211, 70, 37],
                5: [1, 89, 33],
                6: [248, 82, 28],
                7: [29, 94, 52],
                8: [302, 88, 26],
                9: [135, 76, 32],
                10: [245, 21, 43],
                11: [211, 70, 37]
            },
            "Adrian Bernard Klein (1930)": {
                english: [
                    "dark red",
                    "red",
                    "red orange",
                    "orange",
                    "yellow",
                    "yellow green",
                    "green",
                    "blue-green",
                    "blue",
                    "blue violet",
                    "violet",
                    "dark violet",
                ],
                format: "HSL",
                ref: "Klein, p.209",
                0: [0, 91, 40],
                1: [360, 96, 51],
                2: [14, 91, 51],
                3: [29, 94, 52],
                4: [60, 90, 60],
                5: [73, 73, 55],
                6: [135, 76, 32],
                7: [172, 68, 34],
                8: [248, 82, 28],
                9: [292, 70, 31],
                10: [325, 84, 46],
                11: [330, 84, 34]
            },
            "August Aeppli (1940)": {
                english: [
                    "red",
                    null,
                    "orange",
                    null,
                    "yellow",
                    null,
                    "green",
                    "blue-green",
                    null,
                    "ultramarine blue",
                    "violet",
                    "purple",
                ],
                format: "HSL",
                ref: "Gerstner, p.169",
                0: [0, 96, 51],
                1: [0, 0, 0],
                2: [29, 94, 52],
                3: [0, 0, 0],
                4: [60, 90, 60],
                5: [0, 0, 0],
                6: [135, 76, 32],
                7: [172, 68, 34],
                8: [0, 0, 0],
                9: [211, 70, 37],
                10: [273, 80, 27],
                11: [302, 88, 26]
            },
            "I. J. Belmont (1944)": {
                english: [
                    "red",
                    "red-orange",
                    "orange",
                    "yellow-orange",
                    "yellow",
                    "yellow-green",
                    "green",
                    "blue-green",
                    "blue",
                    "blue-violet",
                    "violet",
                    "red-violet",
                ],
                ref: "Belmont, p.226",
                0: [360, 96, 51],
                1: [14, 91, 51],
                2: [29, 94, 52],
                3: [50, 93, 52],
                4: [60, 90, 60],
                5: [73, 73, 55],
                6: [135, 76, 32],
                7: [172, 68, 34],
                8: [248, 82, 28],
                9: [313, 78, 37],
                10: [325, 84, 46],
                11: [338, 85, 37]
            },
            "Steve Zieverink (2004)": {
                english: [
                    "yellow-green",
                    "green",
                    "blue-green",
                    "blue",
                    "indigo",
                    "violet",
                    "ultra violet",
                    "infra red",
                    "red",
                    "orange",
                    "yellow-white",
                    "yellow",
                ],
                format: "HSL",
                ref: "Cincinnati Contemporary Art Center",
                0: [73, 73, 55],
                1: [135, 76, 32],
                2: [172, 68, 34],
                3: [248, 82, 28],
                4: [302, 88, 26],
                5: [325, 84, 46],
                6: [326, 79, 24],
                7: [1, 89, 33],
                8: [360, 96, 51],
                9: [29, 94, 52],
                10: [62, 78, 74],
                11: [60, 90, 60]
            },
            "Circle of Fifths (Johnston 2003)": {
                english: [
                    "yellow",
                    "blue",
                    "orange",
                    "teal",
                    "red",
                    "green",
                    "purple",
                    "light orange",
                    "light blue",
                    "dark orange",
                    "dark green",
                    "violet",
                ],
                format: "RGB",
                ref: "Joseph Johnston",
                0: [255, 255, 0],
                1: [50, 0, 255],
                2: [255, 150, 0],
                3: [0, 210, 180],
                4: [255, 0, 0],
                5: [130, 255, 0],
                6: [150, 0, 200],
                7: [255, 195, 0],
                8: [30, 130, 255],
                9: [255, 100, 0],
                10: [0, 200, 0],
                11: [225, 0, 225]
            },
            "Circle of Fifths (Wheatman 2002)": {
                data: [
                    "#122400",
                    "#2E002E",
                    "#002914",
                    "#470000",
                    "#002142",
                    "#2E2E00",
                    "#290052",
                    "#003D00",
                    "#520029",
                    "#003D3D",
                    "#522900",
                    "#000080",
                    "#244700",
                    "#570057",
                    "#004D26",
                    "#7A0000",
                    "#003B75",
                    "#4C4D00",
                    "#47008F",
                    "#006100",
                    "#850042",
                    "#005C5C",
                    "#804000",
                    "#0000C7",
                    "#366B00",
                    "#80007F",
                    "#00753B",
                    "#B80000",
                    "#0057AD",
                    "#6B6B00",
                    "#6600CC",
                    "#008A00",
                    "#B8005C",
                    "#007F80",
                    "#B35900",
                    "#2424FF",
                    "#478F00",
                    "#AD00AD",
                    "#00994D",
                    "#F00000",
                    "#0073E6",
                    "#8F8F00",
                    "#8A14FF",
                    "#00AD00",
                    "#EB0075",
                    "#00A3A3",
                    "#E07000",
                    "#6B6BFF",
                    "#5CB800",
                    "#DB00DB",
                    "#00C261",
                    "#FF5757",
                    "#3399FF",
                    "#ADAD00",
                    "#B56BFF",
                    "#00D600",
                    "#FF57AB",
                    "#00C7C7",
                    "#FF9124",
                    "#9999FF",
                    "#6EDB00",
                    "#FF29FF",
                    "#00E070",
                    "#FF9999",
                    "#7ABDFF",
                    "#D1D100",
                    "#D1A3FF",
                    "#00FA00",
                    "#FFA3D1",
                    "#00E5E6",
                    "#FFC285",
                    "#C2C2FF",
                    "#80FF00",
                    "#FFA8FF",
                    "#00E070",
                    "#FFCCCC",
                    "#C2E0FF",
                    "#F0F000",
                    "#EBD6FF",
                    "#ADFFAD",
                    "#FFD6EB",
                    "#8AFFFF",
                    "#FFEBD6",
                    "#EBEBFF",
                    "#E0FFC2",
                    "#FFEBFF",
                    "#E5FFF2",
                    "#FFF5F5",
                ],
                english: [],
                format: "HEX",
                ref: "Stuart Wheatman"
            }
        },
        // tslint:enable:object-literal-sort-keys
        map: function (type) {
            var data = {};
            var blend = function (a, b) { return [
                // tslint:disable-next-line:no-bitwise
                (a[0] * 0.5 + b[0] * 0.5 + 0.5) >> 0,
                // tslint:disable-next-line:no-bitwise
                (a[1] * 0.5 + b[1] * 0.5 + 0.5) >> 0,
                // tslint:disable-next-line:no-bitwise
                (a[2] * 0.5 + b[2] * 0.5 + 0.5) >> 0,
            ]; };
            var syn = Synesthesia.data;
            var colors = syn[type] || syn["D. D. Jameson (1844)"];
            for (var note = 0, pclr = void 0, H = void 0, S = void 0, L = void 0; note <= 88; note++) { // creates mapping for 88 notes
                if (colors.data) {
                    data[note] = {
                        hex: colors.data[note],
                        hsl: colors.data[note]
                    };
                }
                else {
                    var clr = colors[(note + 9) % 12];
                    ///
                    switch (colors.format) {
                        case "RGB":
                            clr = colorspace_1["default"](clr, "RGB>HSL");
                            // tslint:disable-next-line:no-bitwise
                            H = clr.H >> 0;
                            // tslint:disable-next-line:no-bitwise
                            S = clr.S >> 0;
                            // tslint:disable-next-line:no-bitwise
                            L = clr.L >> 0;
                            break;
                        case "HSL":
                            H = clr[0];
                            S = clr[1];
                            L = clr[2];
                            break;
                    }
                    if (H === S && S === L) { // note color is unset
                        clr = blend(pclr, colors[(note + 10) % 12]);
                    }
                    data[note] = {
                        hex: colorspace_1["default"]({ H: H, S: S, L: L }, "HSL>RGB>HEX>W3"),
                        hsl: "hsla(" + H + "," + S + "%," + L + "%, 1)"
                    };
                    pclr = clr;
                }
            }
            return data;
        }
    };
    exports["default"] = Synesthesia;
});
//# sourceMappingURL=midi.js.map