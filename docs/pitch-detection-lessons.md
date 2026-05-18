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

During knowledge checks, guide before telling. If the user gives a partial or uncertain answer, ask one targeted follow-up question before giving a hint, correction, or completed answer. If the answer remains vague, keep narrowing the question until the user reaches the answer or asks to stop.

This lesson group is not complete when the code merely works. It is complete only after the user passes a quiz covering all eight stages and explicitly confirms the material is understood.

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

### Lesson 1: Waveform samples and generated sine buffers

- Focused test: `src/lib/audio/waveform.test.ts`
- What passed: `generateSineWave(...)` returns a deterministic time-domain buffer with the requested `frequency`, `sampleRate`, and `sampleCount`. The test proves a 1 Hz wave sampled 4 times per second produces the expected first-cycle shape: `0`, `1`, `0`, `-1`.
- What the code proves: a sample index can be converted to seconds with `index / sampleRate`, seconds can be converted to completed cycles with `frequency * seconds`, and cycles can be converted to radians with `cycles * 2 * Math.PI`.
- Next signal problem: real microphone input may be silent or too weak, so Lesson 2 measures RMS input level before attempting period detection.

### Lesson 2: RMS input level

- Focused test: `src/lib/audio/input-level.test.ts`
- What passed: `measureRms(...)` returns `0` for empty or silent buffers, measures `[1, -1, 1, -1]` as a strong signal with RMS `1`, and measures `[0.1, -0.1, 0.1, -0.1]` as RMS `0.1` without positive and negative samples canceling out.
- What the code proves: signal strength needs square, mean, then square root. `evaluateInputLevel(...)` uses that RMS value internally to reject input below a configured quiet threshold before later pitch stages try to find a waveform period, while callers receive only `usable-input` or `quiet-input` so the measurement technique can change later.
- Next signal problem: an audible signal can still be the wrong shape or too ambiguous, so Lesson 3 looks for a repeated period in generated buffers.

### Lesson 3: Period length

- Focused test: `src/lib/audio/period.test.ts`
- What passed: `estimatePeriodLength(...)` detects clean generated sine buffers with 4-sample and 8-sample periods, and rejects a short buffer that does not contain enough repeated waveform to compare cycles.
- What the code proves: one period is the shift where the waveform best matches itself again. The first estimator compares samples against shifted copies of the same buffer and returns the smallest clear repeating period with a domain reason.
- Next signal problem: a period length is still measured in samples, so Lesson 4 converts period length into hertz with `frequency = sampleRate / periodLength`.

### Lesson 4: Frequency conversion

- Focused test: `src/lib/audio/frequency.test.ts`
- What passed: `periodLengthToFrequency(...)` converts period length and sample rate into hertz, and `estimateFrequency(...)` returns expected 1 Hz and 2 Hz estimates from clean generated sine buffers while preserving period rejection reasons.
- What the code proves: frequency is cycles per second, so `sampleRate / periodLength` converts samples-per-second divided by samples-per-cycle into cycles-per-second. The estimator now chooses the smallest clear repeating period so larger repeated copies do not halve the detected frequency in clean generated buffers.
- Next signal problem: frequency is still raw hertz, so Lesson 5 maps accepted frequencies to musical note names and cents offsets.

### Lesson 5: Note and cents mapping

- Focused tests: `src/lib/music/notes.test.ts` and `src/lib/audio/pitch.test.ts`
- What passed: `nearestNoteFromFrequency(...)` maps 440 Hz to A4 with 0 cents, maps slightly sharp A4 input to positive cents, and maps slightly flat A4 input to negative cents. `estimatePitch(...)` now turns accepted clean generated samples into A4 pitch feedback and preserves quiet or period rejection reasons.
- What the code proves: hertz becomes musical feedback through `src/lib/music`, where note names, target frequencies, and cents math belong. `src/lib/audio` owns the detector sequence and hands accepted frequency estimates to the music boundary rather than duplicating note formulas.
- Next signal problem: an accepted note can still be a bad guess when the waveform is noisy or ambiguous, so Lesson 6 adds confidence scoring and ambiguous-input rejection.

### Lesson 6: Confidence scoring

- Focused test: `src/lib/audio/confidence.test.ts`
- What passed: `estimatePitch(...)` reports high confidence for a clean generated A4 buffer, rejects audible unclear input with `unclear-pitch`, and keeps the smallest clear period so a clean repeated wave does not drop an octave.
- What the code proves: confidence is shape agreement, not loudness. The detector compares a shifted copy of the waveform against the original, normalizes the shift error by signal power, and accepts a candidate period only when it is a confidence peak rather than a tiny nearby slide that merely looks similar.
- Next signal problem: accepted estimates can still jump around frame to frame, so Lesson 7 adds smoothing and hysteresis before UI tools treat a note as stable.

### Lesson 7: Smoothing and hysteresis

- Focused test: `src/lib/audio/stable-pitch.test.ts`
- What passed: `buildStablePitchState(...)` withholds stable output until enough recent estimates agree, keeps the current stable note through a jittery outlier, changes to a new note only after that note settles, clears stable output after repeated rejected estimates, and lets tools choose faster or stricter stability rules through `StablePitchOptions`.
- What the code proves: smoothing is a state rule over pitch estimates, not another waveform detector. A moving window counts recent agreement, while hysteresis keeps the previous stable note during short bursts of disagreement so tuner and scale practice UI do not twitch at every buffer.
- Next signal problem: the detector is still fed by generated buffers or synthetic estimates, so Lesson 8 connects browser analyser buffers to the same tested detector boundary.
