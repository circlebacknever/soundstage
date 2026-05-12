# Pitch Detection Lesson Plan

This file is the teaching plan for building the SoundStage pitch detector. Each lesson pauses before implementation to explain the signal idea, names the focused test, then records what passed after the code works.

## How To Use This Plan

For each lesson:

1. Explain the concept in plain language.
2. Name the module boundary in `src/lib/audio` or `src/lib/music`.
3. Write the focused test first.
4. Confirm the test fails for the expected reason when practical.
5. Implement the smallest code that passes the test.
6. Record what the code now proves and which signal problem comes next.

## Lesson Checkpoints

1. Waveform samples and generated sine buffers
   - Learning goal: understand that microphone input arrives as a sequence of amplitude samples over time.
   - Test first: generated sine buffers have the expected length, sample rate, and repeatable shape.
   - Module target: `src/lib/audio`.
   - Completion proof: generated buffers can drive detector tests without live microphone input.

2. RMS input level
   - Learning goal: understand RMS as a practical measure of signal strength.
   - Test first: silent buffers are rejected and audible buffers pass the level gate.
   - Module target: `src/lib/audio`.
   - Completion proof: the detector can distinguish silence from usable signal.

3. Period length
   - Learning goal: understand that pitch comes from the repeated period of a waveform.
   - Test first: known generated waves produce the expected period length.
   - Module target: `src/lib/audio`.
   - Completion proof: the detector can estimate how many samples make one cycle.

4. Frequency conversion
   - Learning goal: understand `frequency = sampleRate / periodLength`.
   - Test first: known period lengths produce expected hertz values.
   - Module target: `src/lib/audio`.
   - Completion proof: period estimates become usable frequencies.

5. Note and cents mapping
   - Learning goal: understand nearest note selection and cents offset.
   - Test first: 440 Hz maps to A4, sharp values return positive cents, and flat values return negative cents.
   - Module target: `src/lib/music`.
   - Completion proof: raw frequency can become musical feedback.

6. Confidence scoring
   - Learning goal: understand why repeated patterns can be weak, ambiguous, or octave-shifted.
   - Test first: noisy or unclear buffers return a rejection reason.
   - Module target: `src/lib/audio`.
   - Completion proof: the detector can refuse bad guesses.

7. Smoothing and hysteresis
   - Learning goal: understand why live estimates jitter and how small windows stabilize UI.
   - Test first: jittery estimate sequences hold stable state until the configured tolerance is met.
   - Module target: `src/lib/audio`.
   - Completion proof: the UI receives stable pitch state instead of raw twitch.

8. Live microphone integration
   - Learning goal: understand how analyser buffers feed the tested detector.
   - Test first: analyser wrapper hands time-domain buffers to the detector boundary.
   - Module target: `src/lib/audio`.
   - Completion proof: live microphone samples can use the same path proven by generated buffers.

## Glossary

- Sample: one numeric amplitude reading from an audio buffer.
- Sample rate: how many samples the browser captures per second.
- Period: how many samples it takes for a waveform cycle to repeat.
- Frequency: cycles per second, measured in hertz.
- RMS: root mean square, used here as signal strength.
- Cents: musical distance from a target note, where 100 cents equals one semitone.
- Confidence: a score that says whether the detected period looks trustworthy.
- Hysteresis: a stability rule that prevents tiny changes from flipping UI state too eagerly.

## Lesson Log

Record each lesson result here during implementation. Include the focused test, what passed, and the next signal problem.
