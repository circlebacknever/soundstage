# SoundStage V2 Feature Ideas

This file parks future SoundStage ideas that fit the app's local-first music utility goal and give Web Audio room to do interesting work.

V2 ideas should pass three tests:

1. They help a beginner musician practice, listen, tune, count, or understand sound.
2. They preserve local-first use through browser storage, local files, and local audio.
3. They give the browser audio stack a real job.

## Small Useful Tools

### Reference tone player

Play a clean reference note for a selected guitar string, fretboard note, or scale degree.

- User value: helps players match pitch by ear before relying on the tuner.
- Web Audio pieces: `OscillatorNode`, `GainNode`, `AudioContext.currentTime`.
- Difficulty: small.
- Good first version: tap a string target in the tuner and hear a 1-second sine or softened triangle tone.

### Tuning drone

Play a steady root note while the user practices scales or checks intonation.

- User value: teaches pitch center and makes scale practice less visually dependent.
- Web Audio pieces: `OscillatorNode`, `GainNode`, slow gain envelopes.
- Difficulty: small.
- Good first version: root drone toggle on scale practice.

### Click sound lab

Let the user choose or shape metronome clicks: wood, beep, cowbell, soft tick, hard accent.

- User value: makes the metronome less annoying, which matters because annoying tools get abandoned.
- Web Audio pieces: short oscillators, noise bursts, `GainNode`, `BiquadFilterNode`, scheduled envelopes.
- Difficulty: small to medium.
- Good first version: synthesize the three v1 click labels as local generated sounds.

### Waveform viewer

Show the live microphone waveform while the tuner listens.

- User value: makes silence, clipping, noise, and weak input visible.
- Web Audio pieces: `AnalyserNode.getFloatTimeDomainData(...)`, canvas or SVG rendering.
- Difficulty: small.
- Good first version: collapsed diagnostic panel on the tuner error states.

### Spectrum viewer

Show frequency bars for the live microphone input.

- User value: helps explain why noisy rooms confuse pitch detection.
- Web Audio pieces: `AnalyserNode.getByteFrequencyData(...)`.
- Difficulty: small to medium.
- Good first version: "why we are confused" view when confidence stays low.

## Practice Features

### Call-and-response scale trainer

SoundStage plays a note from the selected scale, then the user plays it back through the mic.

- User value: combines ear training, fretboard learning, and pitch matching.
- Web Audio pieces: `OscillatorNode` for prompts, pitch detector for responses, scheduled timing.
- Difficulty: medium.
- Good first version: one note at a time, ascending scale only.

### Interval trainer

Play two notes and ask the user to identify the interval.

- User value: builds ear training from a small generated prompt set.
- Web Audio pieces: paired oscillators or scheduled single oscillator frequencies, gain envelopes.
- Difficulty: medium.
- Good first version: unison, minor third, major third, perfect fifth, octave.

### Rhythm trainer

Ask the user to clap or strum against a metronome and show timing accuracy.

- User value: teaches groove and timing alongside pitch.
- Web Audio pieces: metronome scheduler, microphone analyser, onset detection from RMS spikes.
- Difficulty: medium to hard.
- Good first version: tap/clap detection with "early", "late", or "on it" feedback.

### Fretboard playback

Let the user tap scale or chord shapes and hear each note.

- User value: connects fretboard geometry to sound.
- Web Audio pieces: oscillator tone playback or sampled note playback.
- Difficulty: medium.
- Good first version: scale preview plays each highlighted fretboard cell in order.

### Chord voicing preview

Play chord shapes from the chord library.

- User value: turns static chord diagrams into something players can hear.
- Web Audio pieces: stacked oscillators, gain envelopes, optional slight strum offsets.
- Difficulty: medium.
- Good first version: one clean synthesized voicing per chord shape.

### Strum pattern trainer

Show a strum pattern, schedule guide clicks, and listen for approximate strum timing.

- User value: gives rhythm practice a guitar-shaped workflow.
- Web Audio pieces: scheduler, analyser, onset detection, visual beat state.
- Difficulty: medium to hard.
- Good first version: downstroke-only quarter notes, then eighth-note patterns.

## Audio Diagnostics

### Microphone setup check

Before a mic tool starts, show whether the browser hears silence, normal input, clipping, or noisy room tone.

- User value: turns mic failure into a concrete fix.
- Web Audio pieces: analyser frames, RMS, peak level, confidence scoring.
- Difficulty: medium.
- Good first version: a 3-second setup meter after permission is granted.

### Pitch detector explanation mode

Show the detector's current signal facts: RMS, estimated period, frequency, confidence, nearest note, and cents.

- User value: teaches signal processing while debugging the tuner.
- Web Audio pieces: existing detector outputs plus a debug display.
- Difficulty: medium.
- Good first version: developer/learning toggle inside the tuner.

### Noise fingerprint

Sample the room before practice and warn if the background has strong pitched or broadband noise.

- User value: catches fans, monitors, hum, and room noise before they ruin detection.
- Web Audio pieces: analyser frequency data, RMS, confidence rejection reasons.
- Difficulty: hard.
- Good first version: "room is quiet enough" or "move closer / lower background noise."

## Web Audio Playground Features

### String Lab

A learning toy that shows how string length, tension, pluck position, and damping affect pitch and tone.

- User value: teaches why frets change pitch and why strings decay.
- Web Audio pieces: oscillator prototype first, then Karplus-Strong plucked-string synthesis.
- Difficulty: medium to hard.
- Good first version: visual string plus one synthetic pluck per fret.

### Tiny synthetic guitar

A playable guitar-like instrument built inside the browser.

- User value: lets users hear fretboard notes and scales when no instrument is nearby.
- Web Audio pieces: generated buffers, `AudioBufferSourceNode`, gain envelopes, filters, optional `AudioWorkletNode`.
- Difficulty: hard.
- Good first version: six strings, one clean plucked tone, keyboard or touch input.

### Pedalboard Lab

Let users hear simple effects: filter, delay, tremolo, distortion, panning, and reverb.

- User value: teaches sound shaping and gives the app a lab bench for Web Audio.
- Web Audio pieces: `BiquadFilterNode`, `DelayNode`, `WaveShaperNode`, `StereoPannerNode`, `ConvolverNode`, gain automation.
- Difficulty: hard.
- Good first version: generated tone through one effect at a time.

### Room reverb demo

Let users switch between small room, hall, and strange resonant spaces.

- User value: teaches why the same note feels different in different spaces.
- Web Audio pieces: `ConvolverNode`, generated or bundled impulse responses.
- Difficulty: medium to hard.
- Good first version: reference tone through two local impulse responses.

### Draw-a-wave synth

Let users draw a waveform and hear it as a tone.

- User value: links waveform shape to timbre in a very direct way.
- Web Audio pieces: `PeriodicWave`, oscillator custom waveforms, gain envelopes.
- Difficulty: hard.
- Good first version: draw a simple waveform, play A4, compare with sine and square waves.

## Bigger Swings

### Local practice recorder

Record short practice takes locally so users can replay themselves.

- User value: listening back catches problems the live moment hides.
- Web Audio pieces: `MediaRecorder` or `MediaStreamAudioDestinationNode`.
- Difficulty: hard.
- Privacy boundary: this must be opt-in, local-only, visibly recording, and easy to delete.
- Good first version: 10-second local clip attached to a scale run.

### Slowdown looper

Load a local audio file, loop a section, and slow it down for practice.

- User value: helps users learn songs and riffs by ear.
- Web Audio pieces: `AudioBufferSourceNode`, playback rate, gain, optional filtering.
- Difficulty: hard.
- Good first version: local file only, one loop region, 75 percent and 50 percent speed.

### Adaptive metronome

Listen to the user and gently pull the visual feedback toward their actual timing.

- User value: teaches steady time by showing drift.
- Web Audio pieces: scheduler, analyser, onset detection, timing comparison.
- Difficulty: hard.
- Good first version: fixed metronome with a timing scatter plot.

### MIDI bridge

Accept MIDI input for note selection, ear training answers, or synth controls.

- User value: makes the app friendlier to users with keyboards or MIDI controllers.
- Web Audio pieces: Web MIDI controls Web Audio nodes; Web MIDI is separate from Web Audio.
- Difficulty: medium to hard.
- Good first version: MIDI keyboard triggers reference tones.

## First Candidates

The best early V2 candidates are:

1. Reference tone player, because it is small, useful, and teaches `OscillatorNode`.
2. Waveform viewer, because it helps debug mic setup and teaches `AnalyserNode`.
3. Click sound lab, because the metronome already needs synthesized clicks.
4. Call-and-response scale trainer, because it combines the existing pitch detector with generated tones.
5. String Lab, because it is a proper flex and still teaches guitar.

## Design Notes

- Keep browser audio setup inside `src/lib/audio`; route components should receive domain results.
- Keep music facts inside `src/lib/music`; generated notes, intervals, scales, and chord tones should come from tested helpers.
- Keep recording separate from listening. Listening reads analyser frames. Recording uses explicit recording APIs and needs visible user control.
- Prefer small Web Audio graphs first. A graph with three nodes that teaches one idea beats a fake studio rack that nobody can reason about.
