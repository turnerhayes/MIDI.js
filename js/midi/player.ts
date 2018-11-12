/*
  ----------------------------------------------------------
  MIDI.Player : 0.3.1 : 2015-03-26
  ----------------------------------------------------------
  https://github.com/mudcube/MIDI.js
  ----------------------------------------------------------
*/

import MidiFile from "../inc/jasmid/midifile";
import Replayer from "../inc/jasmid/replayer";
import GM from "./gm";
import Loader from "./loader";
import WebAudio from "./plugin.webaudio";

// tslint:disable-next-line:variable-name
const Player = {
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

  resume(onsuccess) {
    if (Player.currentTime < -1) {
      Player.currentTime = -1;
    }
    startAudio(Player.currentTime, null, onsuccess);
  },

  pause() {
    const tmp = Player.restart;
    stopAudio();
    Player.restart = tmp;
  },

  stop() {
    stopAudio();
    Player.restart = 0;
    Player.currentTime = 0;
  },

  addListener(onsuccess) {
    onMidiEvent = onsuccess;
  },

  removeListener() {
    onMidiEvent = undefined;
  },

  clearAnimation() {
    if (Player.animationFrameId)  {
      cancelAnimationFrame(Player.animationFrameId);
    }
  },

  setAnimation(callback) {
    let currentTime = 0;
    let tOurTime = 0;
    let tTheirTime = 0;

    Player.clearAnimation();

    const frame = () => {
      Player.animationFrameId = requestAnimationFrame(frame);

      if (Player.endTime === 0) {
        return;
      }

      if (Player.playing) {
        currentTime = (tTheirTime === Player.currentTime) ? tOurTime - Date.now() : 0;
        if (Player.currentTime === 0) {
          currentTime = 0;
        } else {
          currentTime = Player.currentTime - currentTime;
        }
        if (tTheirTime !== Player.currentTime) {
          tOurTime = Date.now();
          tTheirTime = Player.currentTime;
        }
      } else { // paused
        currentTime = Player.currentTime;
      }
      ///
      const endTime = Player.endTime;
      const percent = currentTime / endTime;
      const total = currentTime / 1000;
      const minutes = total / 60;
      const seconds = total - (minutes * 60);
      const t1 = minutes * 60 + seconds;
      const t2 = (endTime / 1000);
      ///
      if (t2 - t1 < -1.0) {
        return;
      } else {
        callback({
          end: t2,
          events: noteRegistrar,
          now: t1,
        });
      }
    };

    requestAnimationFrame(frame);
  },

  // helpers

  loadMidiFile(onsuccess, onprogress, onerror) {
    try {
      Player.replayer = new Replayer(MidiFile(Player.currentData), Player.timeWarp, null, Player.BPM);
      Player.data = Player.replayer.getData();
      Player.endTime = getLength();

      Loader.loadPlugin({
        onerror,
        onprogress,
        onsuccess,
      });
    } catch (event) {
      if (onerror) {
        onerror(event);
      }
    }
  },

  loadFile(file, onsuccess, onprogress, onerror) {
    Player.stop();
    if (file.indexOf("base64,") !== -1) {
      const data = window.atob(file.split(",")[1]);
      Player.currentData = data;
      Player.loadMidiFile(onsuccess, onprogress, onerror);
    } else {
      const fetch = new XMLHttpRequest();
      fetch.open("GET", file);
      fetch.overrideMimeType("text/plain; charset=x-user-defined");
      fetch.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status === 200) {
            const t = this.responseText || "";
            const ff = [];
            const mx = t.length;
            const scc = String.fromCharCode;
            for (let z = 0; z < mx; z++) {
              // tslint:disable-next-line:no-bitwise
              ff[z] = scc(t.charCodeAt(z) & 255);
            }
            ///
            const data = ff.join("");
            Player.currentData = data;
            Player.loadMidiFile(onsuccess, onprogress, onerror);
          } else {
            if (onerror) {
              onerror("Unable to load MIDI file");
            }
          }
        }
      };
      fetch.send();
    }
  },

  getFileInstruments() {
    const instruments = {};
    const programs = {};

    for (const dataItem of Player.data) {
      const event = dataItem[0].event;
      if (event.type !== "channel") {
        continue;
      }
      const channel = event.channel;
      switch (event.subtype) {
        case "controller":
          break;
        case "programChange":
          programs[channel] = event.programNumber;
          break;
        case "noteOn":
          const program = programs[channel];
          const gm = GM.byId[isFinite(program) ? program : channel];
          instruments[gm.id] = true;
          break;
      }
    }

    const ret = [];
    for (const key in instruments) {
      if (!Object.prototype.hasOwnProperty.call(instruments, key)) {
        continue;
      }

      ret.push(key);
    }
    return ret;
  },
};

// Playing the audio
const eventQueue = []; // hold events to be triggered
let queuedTime; //
let startTime = 0; // to measure time elapse
let noteRegistrar = {}; // get event for requested note
let onMidiEvent; // listener

const scheduleTracking = (channel, note, currentTime, offset, message, velocity) => {
  return setTimeout(() => {
    const data = {
      channel,
      end: Player.endTime,
      message,
      note,
      now: currentTime,
      velocity,
    };

    if (message === 128) {
      delete noteRegistrar[note];
    } else {
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
    } else if (Player.currentTime === queuedTime && queuedTime < Player.endTime) { // grab next sequence
      startAudio(queuedTime, true);
    }
  }, currentTime - offset);
};

const getContext = () => {
  if (Loader.defaultPlugin.api === "webaudio") {
    return WebAudio.getContext();
  } else {
    Player.ctx = {currentTime: 0};
  }
  return Player.ctx;
};

const getLength = () => {
  const data =  Player.data;
  const length = data.length;
  let totalTime = 0.5;

  for (let n = 0; n < length; n++) {
    totalTime += data[n][1];
  }

  return totalTime;
};

// tslint:disable-next-line:variable-name
let __now;

const getNow = () => {
  if (window.performance && window.performance.now) {
      return window.performance.now();
  } else {
    return Date.now();
  }
};

const startAudio = (currentTime, fromCache, onsuccess?) => {
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

  let note;
  let offset = 0;
  let messages = 0;
  const data = Player.data;
  const ctx = getContext();
  const length = data.length;

  queuedTime = 0.5;

  const interval = eventQueue[0] && eventQueue[0].interval || 0;
  const foffset = currentTime - Player.currentTime;

  if (Loader.defaultPlugin.api !== "webaudio") { // set currentTime on ctx
    const now = getNow();
    __now = __now || now;
    ctx.currentTime = (now - __now) / 1000;
  }

  startTime = ctx.currentTime;

  for (let n = 0; n < length && messages < 100; n++) {
    const obj = data[n];
    queuedTime += obj[1];
    if (queuedTime <= currentTime) {
      offset = queuedTime;
      continue;
    }

    currentTime = queuedTime - offset;

    const event = obj[0].event;
    if (event.type !== "channel") {
      continue;
    }

    const channelId = event.channel;
    const channel = GM.channels[channelId];
    const delay = ctx.currentTime + ((currentTime + foffset + Player.startDelay) / 1000);
    const queueTime = queuedTime - offset + Player.startDelay;
    switch (event.subtype) {
      case "controller":
        Loader.defaultPlugin.setController(channelId, event.controllerType, event.value, delay);
        break;
      case "programChange":
        Loader.defaultPlugin.programChange(channelId, event.programNumber, delay);
        break;
      case "pitchBend":
        Loader.defaultPlugin.pitchBend(channelId, event.value, delay);
        break;
      case "noteOn":
        if (channel.mute) { break; }
        note = event.noteNumber - (Player.MIDIOffset || 0);
        eventQueue.push({
            event,
            interval: scheduleTracking(
              channelId,
              note,
              queuedTime + Player.startDelay,
              offset - foffset,
              144,
              event.velocity,
            ),
            source: Loader.defaultPlugin.noteOn(channelId, event.noteNumber, event.velocity, delay),
            time: queueTime,
        });
        messages++;
        break;
      case "noteOff":
        if (channel.mute) { break; }
        note = event.noteNumber - (Player.MIDIOffset || 0);
        eventQueue.push({
            event,
            interval: scheduleTracking(channelId, note, queuedTime, offset - foffset, 128, 0),
            source: Loader.defaultPlugin.noteOff(channelId, event.noteNumber, delay),
            time: queueTime,
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

Object.defineProperties(
  Player,
  {
    start: {
      configurable: true,
      enumerable: true,
      value: Player.resume,
    },
  },
);

const stopAudio = () => {
  const ctx = getContext();
  Player.playing = false;
  Player.restart += (ctx.currentTime - startTime) * 1000;
  // stop the audio, and intervals
  while (eventQueue.length) {
    const o = eventQueue.pop();
    window.clearInterval(o.interval);
    if (!o.source) { continue; } // is not webaudio
    if (typeof(o.source) === "number") {
      window.clearTimeout(o.source);
    } else { // webaudio
      o.source.disconnect(0);
    }
  }
  // run callback to cancel any notes still playing
  for (const key in noteRegistrar) {
    if (!Object.prototype.hasOwnProperty.call(noteRegistrar, key)) {
      continue;
    }

    const o = noteRegistrar[key];
    if (noteRegistrar[key].message === 144 && onMidiEvent) {
      onMidiEvent({
        channel: o.channel,
        end: o.end,
        message: 128,
        note: o.note,
        now: o.now,
        velocity: o.velocity,
      });
    }
  }
  // reset noteRegistrar
  noteRegistrar = {};
};

export default Player;
