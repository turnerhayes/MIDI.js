/*
  ----------------------------------------------------------------------
  Web MIDI API - Native Soundbanks
  ----------------------------------------------------------------------
  http://webaudio.github.io/web-midi-api/
  ----------------------------------------------------------------------
*/

import Loader from "./loader";

let plugin = null;
let output = null;
const channels = [];

class WebMIDI implements IAudioPlugin {
  public api = "webmidi";

  public send(data, delay) { // set channel volume
    output.send(data, delay * 1000);
  }

  public setController(channel, type, value, delay) {
    output.send([channel, type, value], delay * 1000);
  }

   public setVolume(channel, volume, delay) { // set channel volume
    output.send([0xB0 + channel, 0x07, volume], delay * 1000);
  }

  public programChange(channel, program, delay) { // change patch (instrument)
    output.send([0xC0 + channel, program], delay * 1000);
  }

  public pitchBend(channel, program, delay) { // pitch bend
    output.send([0xE0 + channel, program], delay * 1000);
  }

  public noteOn(channel, note, velocity, delay) {
    output.send([0x90 + channel, note, velocity], delay * 1000);
  }

  public noteOff(channel, note, delay) {
    output.send([0x80 + channel, note, 0], delay * 1000);
  }

  public chordOn(channel, chord, velocity, delay) {
    for (const note of chord) {
      output.send([0x90 + channel, note, velocity], delay * 1000);
    }
  }

  public chordOff(channel, chord, delay) {
    for (const note of chord) {
      output.send([0x80 + channel, note, 0], delay * 1000);
    }
  }

  public stopAllNotes() {
    output.cancel();
    for (let channel = 0; channel < 16; channel ++) {
      output.send([0xB0 + channel, 0x7B, 0]);
    }
  }

  public connect(opts) {
    Loader.setDefaultPlugin(this);

    const errFunction = (err?) => { // well at least we tried!
      if ((window as any).AudioContext) { // Chrome
        opts.api = "webaudio";
      } else if ((window as any).Audio) { // Firefox
        opts.api = "audiotag";
      } else { // no support
        return;
      }

      Loader.loadPlugin(opts);
    };

    (navigator as any).requestMIDIAccess().then(
      (access) => {
        plugin = access;
        const pluginOutputs = plugin.outputs;
        if (typeof pluginOutputs === "function") { // Chrome pre-43
          output = pluginOutputs()[0];
        } else { // Chrome post-43
          output = pluginOutputs[0];
        }
        if (output === undefined) { // nothing there...
          errFunction();
        } else {
          if (opts.onsuccess) {
            opts.onsuccess();
          }
        }
      },
      errFunction,
    );
  }
}

export default new WebMIDI();
