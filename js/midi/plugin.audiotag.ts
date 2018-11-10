import GM from "./gm";
import Loader from "./loader";

/*
  ----------------------------------------------------------------------
  AudioTag <audio> - OGG or MPEG Soundbank
  ----------------------------------------------------------------------
  http://dev.w3.org/html5/spec/Overview.html#the-audio-element
  ----------------------------------------------------------------------
*/

// tslint:disable-next-line:variable-name
let tag;

if ((window as any).Audio) {
  class AudioTag implements IAudioPlugin {
    public api = "audiotag";

    public audioBuffers = [];

    public noteToKey = {};

    // instrumentId + noteId that is currently playing in each 'channel', for routing noteOff/chordOff calls
    public notesOn = [];

    // the piano keys
    public notes = {};

    // floating point
    public volume = 127;

    // current channel
    // tslint:disable-next-line:variable-name
    public buffer_nid = -1;

    // tslint:disable-next-line:no-empty
    public send(data, delay) {}

    // tslint:disable-next-line:no-empty
    public setController(channel, type, value, delay) {}

    public setVolume(channel, n) {
      this.volume = n; // - should be channel specific volume
    }

    public programChange(channel, program) {
      GM.channels[channel].instrument = program;
    }

    // tslint:disable-next-line:no-empty
    public pitchBend(channel, program, delay) {}

    public noteOn(channel, note, velocity, delay) {
      const id = this.noteToKey[note];

      if (!this.notes[id]) {
        return;
      }

      if (delay) {
        return setTimeout(function() {
          this.playChannel(channel, id);
        }, delay * 1000);
      } else {
        this.playChannel(channel, id);
      }
    }

    // tslint:disable-next-line:no-empty
    public noteOff(channel, note, delay) {}

    public chordOn(channel, chord, velocity, delay) {
      for (const n of chord) {
        const id = this.noteToKey[n];
        if (!this.notes[id]) {
          continue;
        }

        if (delay) {
          return setTimeout(function() {
            this.playChannel(channel, id);
          }, delay * 1000);
        } else {
          this.playChannel(channel, id);
        }
      }
    }

    public chordOff(channel, chord, delay) {
      for (const n of chord) {
        const id = this.noteToKey[n];
        if (!this.notes[id]) {
          continue;
        }
        if (delay) {
          return setTimeout(function() {
            this.stopChannel(channel, id);
          }, delay * 1000);
        } else {
          this.stopChannel(channel, id);
        }
      }
    }

    public stopAllNotes() {
      for (let nid = 0, length = this.audioBuffers.length; nid < length; nid++) {
        this.audioBuffers[nid].pause();
      }
    }

    public connect(opts) {
      Loader.setDefaultPlugin(this);

      for (const key in GM.keyToNote) {
        if (!Object.prototype.hasOwnProperty.call(GM.keyToNote, key)) {
          continue;
        }

        this.noteToKey[GM.keyToNote[key]] = key;
        this.notes[key] = {id: key};
      }

      if (opts.onsuccess) {
        opts.onsuccess();
      }
    }

    private playChannel(channel, note) {
      if (!GM.channels[channel]) {
        return;
      }

      const instrument = GM.channels[channel].instrument;
      const instrumentId = GM.byId[instrument].id;
      note = this.notes[note];

      if (note) {
        const instrumentNoteId = instrumentId + "" + note.id;
        const nid = (this.buffer_nid + 1) % this.audioBuffers.length;
        const audio = this.audioBuffers[nid];
        this.notesOn[ nid ] = instrumentNoteId;
        if (!(global as any).Soundfont[instrumentId]) {
          if (Loader.DEBUG) {
            console.log("404", instrumentId);
          }
          return;
        }
        audio.src = (global as any).Soundfont[instrumentId][note.id];
        audio.volume = this.volume / 127;
        audio.play();
        this.buffer_nid = nid;
      }
    }

    private stopChannel(channel, note) {
      if (!GM.channels[channel]) {
        return;
      }

      const instrument = GM.channels[channel].instrument;
      const instrumentId = GM.byId[instrument].id;
      note = this.notes[note];

      if (note) {
        const instrumentNoteId = instrumentId + "" + note.id;
        for (let i = 0, len = this.audioBuffers.length; i < len; i++) {
            const nid = (i + this.buffer_nid + 1) % len;
            const cId = this.notesOn[nid];
            if (cId && cId === instrumentNoteId) {
                this.audioBuffers[nid].pause();
                this.notesOn[nid] = null;
                return;
            }
        }
      }
    }
  }

  tag = new AudioTag();

  for (let nid = 0; nid < 12; nid ++) {
    tag.audioBuffers[nid] = new Audio();
  }
}

export default tag ?
  tag :
  null;
