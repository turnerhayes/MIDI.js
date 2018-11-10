declare interface IAudioPlugin {
  api: string;

  send(data, delay);

  setController(channel, type, value, delay);

  setVolume(channel, volume, delay);

  programChange(channel, program, delay); // change patch (instrument),

  pitchBend(channel, program, delay);

  noteOn(channel, note, velocity, delay);

  noteOff(channel, note, delay);

  chordOn(channel, chord, velocity, delay);

  chordOff(channel, chord, delay);

  stopAllNotes();

  connect(opts);
}
