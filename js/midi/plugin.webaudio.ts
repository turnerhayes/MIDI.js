/*
  ----------------------------------------------------------
  Web Audio API - OGG or MPEG Soundbank
  ----------------------------------------------------------
  http://webaudio.github.io/web-audio-api/
  ----------------------------------------------------------
*/

import Tuna from "tunajs";
import Base64Binary from "../inc/shim/Base64binary";
import GM from "./gm";
import Loader from "./loader";

const useStreamingBuffer = false; // !!audioContext.createMediaElementSource;
let ctx; // audio context
const sources = {};
const effects = {};
let masterVolume = 127;

function createAudioContext() {
  return new ((window as any).AudioContext || (window as any).webkitAudioContext)();
}

/* Load audio file: streaming | base64 | arraybuffer
---------------------------------------------------------------------- */
function loadAudio(url, onload, onerror) {
  if (useStreamingBuffer) {
    const audio = new Audio();
    audio.src = url;
    audio.controls = false;
    audio.autoplay = false;
    audio.preload = "none";
    audio.addEventListener("canplay", () => {
      if (onload) {
        onload(audio);
      }
    });
    audio.addEventListener("error", (err) => {
      if (onerror) {
        onerror(err);
      }
    });
    document.body.appendChild(audio);
  } else if (url.indexOf("data:audio") === 0) { // Base64 string
    const base64 = url.split(",")[1];
    const buffer = Base64Binary.decodeArrayBuffer(base64);
    ctx.decodeAudioData(buffer, onload, onerror);
  } else { // XMLHTTP buffer
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
      ctx.decodeAudioData(request.response, onload, onerror);
    };
    request.send();
  }
}

class WebAudio implements IAudioPlugin {
  public api: "webaudio";

  private audioBuffers = {};

  // tslint:disable-next-line:no-empty
  public send(data, delay) {}

  // tslint:disable-next-line:no-empty
  public setController(channelId, type, value, delay) {}

  public setVolume(channelId, volume, delay) {
    if (delay) {
      setTimeout(function() {
        masterVolume = volume;
      }, delay * 1000);
    } else {
      masterVolume = volume;
    }
  }

  public programChange(channelId, program) {
      const channel = GM.channels[channelId];
      channel.instrument = program;
  }

  public pitchBend(channelId, program) {
    const channel = GM.channels[channelId];
    channel.pitchBend = program;
  }

  public noteOn(channelId, noteId, velocity, delay) {
    delay = delay || 0;

    /// check whether the note exists
    const channel = GM.channels[channelId];
    const instrument = channel.instrument;
    const bufferId = instrument + "" + noteId;
    const buffer = this.audioBuffers[bufferId];
    if (!buffer) {
      return;
    }

    /// convert relative delay to absolute delay
    if (delay < ctx.currentTime) {
      delay += ctx.currentTime;
    }

    let source;

    /// create audio buffer
    if (useStreamingBuffer) {
      source = ctx.createMediaElementSource(buffer);
    } else { // XMLHTTP buffer
      source = ctx.createBufferSource();
      source.buffer = buffer;
    }

    /// add effects to buffer
    if (effects) {
      let chain = source;
      for (const key in effects) {
        if (!Object.prototype.hasOwnProperty.call(effects, key)) {
          continue;
        }

        chain.connect(effects[key].input);
        chain = effects[key];
      }
    }

    /// add gain + pitchShift
    const gain = (velocity / 127) * (masterVolume / 127) * 2 - 1;
    source.connect(ctx.destination);
    source.playbackRate.value = 1; // pitch shift
    source.gainNode = ctx.createGain(); // gain
    source.gainNode.connect(ctx.destination);
    source.gainNode.gain.value = Math.min(1.0, Math.max(-1.0, gain));
    source.connect(source.gainNode);

    if (useStreamingBuffer) {
      if (delay) {
        return setTimeout(function() {
          buffer.currentTime = 0;
          buffer.play();
        }, delay * 1000);
      } else {
        buffer.currentTime = 0;
        buffer.play();
      }
    } else {
      source.start(delay || 0);
    }

    sources[channelId + "" + noteId] = source;

    return source;
  }

  public noteOff(channelId, noteId, delay) {
    delay = delay || 0;

    /// check whether the note exists
    const channel = GM.channels[channelId];
    const instrument = channel.instrument;
    const bufferId = instrument + "" + noteId;
    const buffer = this.audioBuffers[bufferId];
    if (buffer) {
      if (delay < ctx.currentTime) {
        delay += ctx.currentTime;
      }
      ///
      const source = sources[channelId + "" + noteId];
      if (source) {
        if (source.gainNode) {
          // @Miranet: 'the values of 0.2 and 0.3 could of course be used as
          // a 'release' parameter for ADSR like time settings.'
          // add { 'metadata': { release: 0.3 } } to soundfont files
          const gain = source.gainNode.gain;
          gain.linearRampToValueAtTime(gain.value, delay);
          gain.linearRampToValueAtTime(-1.0, delay + 0.3);
        }

        if (useStreamingBuffer) {
          if (delay) {
            setTimeout(function() {
              buffer.pause();
            }, delay * 1000);
          } else {
            buffer.pause();
          }
        } else {
          if (source.noteOff) {
            source.noteOff(delay + 0.5);
          } else {
            source.stop(delay + 0.5);
          }
        }

        delete sources[channelId + "" + noteId];

        return source;
      }
    }
  }

  public chordOn(channel, chord, velocity, delay) {
    const res = {};
    for (let n = 0, note, len = chord.length; n < len; n++) {
      res[note = chord[n]] = this.noteOn(channel, note, velocity, delay);
    }
    return res;
  }

  public chordOff(channel, chord, delay) {
    const res = {};
    for (let n = 0, note, len = chord.length; n < len; n++) {
      res[note = chord[n]] = this.noteOff(channel, note, delay);
    }
    return res;
  }

  public stopAllNotes() {
    for (const sid in sources) {
      if (!Object.prototype.hasOwnProperty.call(sources, sid)) {
        continue;
      }

      let delay = 0;
      if (delay < ctx.currentTime) {
        delay += ctx.currentTime;
      }
      const source = sources[sid];
      source.gain.linearRampToValueAtTime(1, delay);
      source.gain.linearRampToValueAtTime(0, delay + 0.3);
      if (source.noteOff) { // old api
        source.noteOff(delay + 0.3);
      } else { // new api
        source.stop(delay + 0.3);
      }
      delete sources[sid];
    }
  }

  public setEffects(list) {
    if (ctx.tunajs) {
      for (const data of list) {
        const effect = new ctx.tunajs[data.type](data);
        effect.connect(ctx.destination);
        effects[data.type] = effect;
      }
    } else {
      return console.log("Effects module not installed.");
    }
  }

  public connect(opts) {
    Loader.setDefaultPlugin(this);
    this.setContext(ctx || createAudioContext(), opts.onsuccess);
  }

  public getContext() {
    return ctx;
  }

  public setContext(newCtx, onload, onprogress?, onerror?) {
    ctx = newCtx;

    /// tuna.js effects module - https://github.com/Dinahmoe/tuna
    if (!ctx.tunajs) {
      ctx.tunajs = new Tuna(ctx);
    }

    /// loading audio files
    const notes = GM.keyToNote;
    const urls = Object.keys(notes);

    const waitForEnd = () => {
      for (const key in bufferPending) { // has pending items
        if (bufferPending[key]) {
          return;
        }
      }

      if (onload) { // run onload once
        onload();
        onload = null;
      }
    };

    const requestAudio = (soundfont, instrumentId, index, key) => {
      const url = soundfont[key];
      if (url) {
        bufferPending[instrumentId] ++;
        loadAudio(url, function(buffer) {
          buffer.id = key;
          const noteId = GM.keyToNote[key];
          this.audioBuffers[instrumentId + "" + noteId] = buffer;

          if (-- bufferPending[instrumentId] === 0) {
            const percent = index / 87;
            soundfont.isLoaded = true;
            waitForEnd();
          }
        }, function(err) {
          console.error(err);
        });
      }
    };

    const bufferPending = {};

    const Soundfont = (global as any).Soundfont;
    for (const instrument in Soundfont) {
      if (!Object.prototype.hasOwnProperty.call(Soundfont, instrument)) {
        continue;
      }

      const soundfont = Soundfont[instrument];
      if (soundfont.isLoaded) {
        continue;
      }

      const synth = GM.byName[instrument];
      const instrumentId = synth.number;

      bufferPending[instrumentId] = 0;

      for (let index = 0; index < urls.length; index++) {
        const key = urls[index];
        requestAudio(soundfont, instrumentId, index, key);
      }
    }

    setTimeout(waitForEnd, 1);
  }
}

export default new WebAudio();
