# pitch-detection-learning Specification

## Purpose
TBD - created by archiving change implement-soundstage-v1. Update Purpose after archive.
## Requirements
### Requirement: Original dependency-free detector
The system SHALL implement pitch detection in first-party TypeScript without importing, copying, adapting, or studying third-party pitch detection implementation source code.

#### Scenario: Build uses no pitch detection package
- **WHEN** the project dependencies are inspected
- **THEN** no dependency exists for pitch detection

#### Scenario: Detector consumes time-domain samples
- **WHEN** the detector runs
- **THEN** it accepts a time-domain sample buffer and sample rate, then returns either a pitch estimate or a rejection reason

#### Scenario: Shared detector feeds tools
- **WHEN** Tuner and Scale Practice need pitch information
- **THEN** both tools consume the same first-party detector output rather than separate pitch algorithms

#### Scenario: Shared live-guitar profile feeds tools
- **WHEN** Tuner and Scale Practice listen to a guitar through the microphone
- **THEN** both tools use the same live-guitar detector profile for quiet-input and stable-pitch gating

### Requirement: Teaching-oriented algorithm stages
The pitch detection implementation SHALL be organized so a maintainer can learn each stage of the algorithm from the code, tests, and implementation notes.

#### Scenario: Reader follows the learning path
- **WHEN** a maintainer reads the detector materials
- **THEN** they can follow waveform samples, period length, frequency conversion, note mapping, cents, confidence, and smoothing in order

#### Scenario: Tests explain generated waveforms
- **WHEN** tests generate synthetic audio buffers
- **THEN** the test names and assertions connect the generated waveform frequency to the expected detector output

#### Scenario: Implementation note explains period math
- **WHEN** a maintainer reads the implementation note
- **THEN** it explains that pitch frequency is derived from repeating waveform period using `frequency = sampleRate / periodLength`

### Requirement: Pitch detection lesson checkpoints
The pitch detection work SHALL include teaching checkpoints before and after each stage so the user learns how the detector works during implementation.

#### Scenario: Lesson checkpoint begins
- **WHEN** work starts on a pitch-detection stage
- **THEN** the engineer explains the concept in plain language, names the focused test that will prove it, and identifies the module boundary being built

#### Scenario: User answer is incomplete
- **WHEN** the user gives a partial or uncertain answer during a lesson checkpoint
- **THEN** the engineer asks a targeted follow-up question before giving a hint, correction, or completed answer

#### Scenario: User answer remains vague
- **WHEN** the user's follow-up answer is still vague or incomplete
- **THEN** the engineer continues with smaller guiding questions until the user reaches the answer or asks to stop

#### Scenario: Lesson checkpoint completes
- **WHEN** the stage implementation passes its focused tests
- **THEN** the engineer summarizes what the code now proves, what signal problem remains, and how the next stage follows from it

### Requirement: Pitch detection comprehension gate
The pitch detection lesson group SHALL remain incomplete until the user demonstrates understanding through a quiz and explicitly confirms the material is understood.

#### Scenario: Lesson group is ready for completion
- **WHEN** every pitch-detection lesson stage has passing focused tests and updated lesson notes
- **THEN** the engineer gives the user a quiz covering waveform samples, RMS input level, period length, frequency conversion, note and cents mapping, confidence, smoothing, and live analyser integration

#### Scenario: Lesson group is marked complete
- **WHEN** the user passes the quiz and confirms they understand the material
- **THEN** the pitch-detection lesson group may be marked complete in the task list

### Requirement: Pitch detection lesson order
The pitch detection teaching plan SHALL proceed in this order: waveform samples and generated sine buffers, RMS input level, period estimation, frequency conversion, note and cents mapping, confidence scoring, smoothing and hysteresis, then live microphone integration.

#### Scenario: Lesson order is followed
- **WHEN** pitch-detection implementation begins
- **THEN** the engineer follows the specified lesson order and records each stage in the lesson note

#### Scenario: Live microphone integration begins
- **WHEN** the team reaches live microphone integration
- **THEN** generated-buffer tests already cover input level, period estimation, frequency conversion, note mapping, confidence, and smoothing

### Requirement: Frequency and note conversion
The system SHALL convert detected frequencies into nearest musical note names, octave numbers, target frequencies, and cents offsets.

#### Scenario: Concert A maps correctly
- **WHEN** the conversion receives 440 Hz
- **THEN** it returns A4 with zero cents offset

#### Scenario: Sharp input returns positive cents
- **WHEN** the conversion receives a frequency above a target note but below the next semitone
- **THEN** it returns the nearest note with a positive cents offset

### Requirement: Signal rejection and smoothing
The detector SHALL reject weak or ambiguous input and smooth accepted estimates before UI tools treat the note as stable.

#### Scenario: Quiet input is rejected
- **WHEN** the sample buffer RMS level is below the configured silence threshold
- **THEN** the detector returns a quiet-input rejection instead of a pitch estimate

#### Scenario: Unstable estimates fail stable-note gating
- **WHEN** consecutive pitch estimates jump outside the configured tolerance window
- **THEN** the detector withholds stable-note output until the estimates settle

### Requirement: Kalman filtering excluded from v1
The v1 detector SHALL use confidence gates, moving windows, and hysteresis for smoothing.

#### Scenario: Smoothing implementation is inspected
- **WHEN** the smoothing code is reviewed
- **THEN** it contains no Kalman filter implementation
