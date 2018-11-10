
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

import loadScript from "../util/dom_request_script";
import XHRequest from "../util/dom_request_xhr";
import audioDetect from "./audioDetect";
import GM from "./gm";
import WebMIDI from "./plugin.webmidi";

const sendRequest = (instrumentId, audioFormat, onprogress, onsuccess, onerror) => {
  const soundfontPath = `${Loader.soundfontUrl}${instrumentId}-${audioFormat}.js`;
  if (Loader.USE_XHR) {
    XHRequest({
      format: "text",
      onerror,
      onprogress,
      onsuccess(event, responseText) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.text = responseText;
        document.body.appendChild(script);
        ///
        onsuccess();
      },
      url: soundfontPath,
    });
  } else {
    loadScript.add({
      onerror,
      onsuccess() {
        onsuccess();
      },
      url: soundfontPath,
      verify: `MIDI.Soundfont["${instrumentId}"]`,
    });
  }
};

const requestQueue = (opts, context) => {
  const audioFormat = opts.format;
  const instruments = opts.instruments;
  const onprogress = opts.onprogress;
  const onerror = opts.onerror;

  const length = instruments.length;
  let pending = length;
  const waitForEnd = function() {
    if (!--pending) {
      if (onprogress) {
        onprogress("load", 1.0);
      }

      Loader.defaultPlugin[context].connect(opts);
    }
  };

  for (let i = 0; i < length; i ++) {
    const instrumentId = instruments[i];
    if (((window as any).Soundfont || {})[instrumentId]) { // already loaded
      waitForEnd();
    } else { // needs to be requested
      sendRequest(
        instruments[i],
        audioFormat,
        (evt, progress) => {
          const fileProgress = progress / length;
          const queueProgress = (length - pending) / length;

          if (onprogress) {
            onprogress("load", fileProgress + queueProgress, instrumentId);
          }
        },
        () => {
          waitForEnd();
        },
        onerror,
      );
    }
  }
};

const connect = {
  webmidi(opts) {
    // cant wait for this to be standardized!
    WebMIDI.connect(opts);
  },

  audiotag(opts) {
    // works ok, kinda like a drunken tuna fish, across the board
    // http://caniuse.com/audio
    requestQueue(opts, "AudioTag");
  },

  webaudio(opts) {
    // works awesome! safari, chrome and firefox support
    // http://caniuse.com/web-audio
    requestQueue(opts, "WebAudio");
  },
};

// tslint:disable-next-line:variable-name
const Loader = {
  DEBUG: true,
  __api: null,
  __audioFormat: null,
  defaultPlugin: ({} as IAudioPlugin),
  soundfontUrl: "./soundfont/",

  USE_XHR: true,
  supports: {},

  loadPlugin(opts) {
    if (typeof opts === "function") {
      opts = {onsuccess: opts};
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
    audioDetect((supports) => {
      const hash = window.location.hash;
      let api = "";

      /// use the most appropriate plugin if not specified
      if (supports[opts.api]) {
        api = opts.api;
      } else if (supports[hash.substr(1)]) {
        api = hash.substr(1);
      } else if (supports.webmidi) {
        api = "webmidi";
      } else if ((window as any).AudioContext) { // Chrome
        api = "webaudio";
      } else if ((window as any).Audio) { // Firefox
        api = "audiotag";
      }

      if (connect[api]) {
        let audioFormat;

        /// use audio/ogg when supported
        if (opts.targetFormat) {
          audioFormat = opts.targetFormat;
        } else { // use best quality
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

  loadResource(opts) {
    let instruments = opts.instruments || opts.instrument || "acoustic_grand_piano";

    if (typeof instruments !== "object") {
      if (instruments || instruments === 0) {
        instruments = [instruments];
      } else {
        instruments = [];
      }
    }
    /// convert numeric ids into strings
    for (let i = 0; i < instruments.length; i ++) {
      const instrument = instruments[i];
      if (instrument === +instrument) { // is numeric
        if (GM.byId[instrument]) {
          instruments[i] = GM.byId[instrument].id;
        }
      }
    }

    opts.format = Loader.__audioFormat;
    opts.instruments = instruments;
    ///
    connect[Loader.__api](opts);
  },

  setDefaultPlugin(plugin) {
    Loader.defaultPlugin = plugin;
  },
};

export default Loader;
