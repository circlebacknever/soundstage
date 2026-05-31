## ADDED Requirements

### Requirement: Scale setup route
The system SHALL provide a `/scales` setup route where the user selects scale type and root key before starting practice.

#### Scenario: Scale setup top bar renders
- **WHEN** the scale setup route is displayed
- **THEN** the top bar shows a back button and title "Scales"

#### Scenario: Default scale selection
- **WHEN** the user opens Scale Practicer for the first time
- **THEN** Major scale and C root are selected by default

#### Scenario: Scale chips render
- **WHEN** the scale setup route is displayed
- **THEN** the chip row contains "Major", "Minor", "Pentatonic", "Blues", and "Dorian", wraps as needed, uses `--paper-soft` with hairline border and `--ink-2` for default chips, and uses `--peri` with contrast-safe text for the selected chip

#### Scenario: Root key picker renders
- **WHEN** the scale setup route is displayed
- **THEN** the root picker shows C, D, E, F, G, A, and B in a grid that keeps each key at least 44px wide, with default keys using `--paper-soft`, Fraunces 600 at 24px, and selected key using `--peri` with contrast-safe text

#### Scenario: Scale state shape is available
- **WHEN** scale state is represented
- **THEN** it includes scale type, root key, mode, expected sequence, and progress index

#### Scenario: User previews a selected scale
- **WHEN** the user changes scale type or root key
- **THEN** the preview fretboard updates to show notes in the selected scale

#### Scenario: Start practice action renders
- **WHEN** the scale setup route is displayed
- **THEN** it shows a full-width primary coral action labeled "Start practice" with a microphone icon

### Requirement: Fretboard mapping
The scale practicer SHALL show a guitar fretboard using the handoff rows, string labels, note cells, and state styling.

#### Scenario: Fretboard frame renders
- **WHEN** a scale fretboard is displayed
- **THEN** it uses `--paper-sink` background, `--r-md` corners, 14px padding, six string rows ordered high `e` at the top to low `E` at the bottom, a fret-number header row, and a 24px string-label column plus equal fret columns for open, 2, 3, and 5

#### Scenario: Fretboard cell geometry renders
- **WHEN** fretboard cells are displayed
- **THEN** each cell is 36px tall, uses `--r-xs` 8px corners, `--paper` background, and hairline border by default

#### Scenario: Scale note appears on fretboard
- **WHEN** a displayed fret/string position belongs to the selected scale
- **THEN** the cell displays the note in Nunito 700 at 13px with `--peri-soft` background, `--peri-ink` text, and `--peri` border

#### Scenario: Out-of-scale cell remains empty
- **WHEN** a displayed fret/string position is outside the selected scale
- **THEN** the cell renders as an empty paper cell

#### Scenario: String labels render
- **WHEN** the fretboard renders its string label column
- **THEN** it displays, top to bottom, "e B G D A E", with lowercase `e` for the high E string on top and uppercase `E` for the low E string on the bottom

### Requirement: Live scale practice route
The system SHALL provide `/scales/practice` for microphone-based scale progression using the selected root and scale type.

#### Scenario: Live practice top bar renders
- **WHEN** live practice is displayed for a selected scale
- **THEN** the top bar shows a back button, a title such as "G major", and a coral REC pill with a pulsing dot and text "REC"

#### Scenario: Practice starts after mic grant
- **WHEN** the user starts practice and microphone access is granted
- **THEN** the app navigates to live practice, starts pitch detection, and displays the next-note card

#### Scenario: Next-note card renders
- **WHEN** live practice is displayed
- **THEN** the app shows a `--coral-soft` card with 24px padding and `--r-md` corners, eyebrow "Next note", a 60px Fraunces 600 next-note letter in `--coral-ink`, progress text such as "3 / 7" in 12px mono, and a 120px by 6px progress bar with `--paper` track and `--coral` fill

#### Scenario: Correct sustained note advances progress
- **WHEN** the detected pitch matches the expected note within 50 cents for at least 300ms
- **THEN** the app marks the matching fretboard cell as hit and advances to the next expected note

#### Scenario: Wrong note blocks progress
- **WHEN** the user sustains a pitch outside the expected target tolerance
- **THEN** the app briefly flashes the relevant state and keeps the same expected note active

### Requirement: Fretboard markers only
The live practice UI SHALL use fretboard cell states as the scoring visualization.

#### Scenario: Practice history is displayed
- **WHEN** notes are played during live practice
- **THEN** the fretboard shows hit and next-note states without adding played-note history chips

#### Scenario: Live fretboard states render
- **WHEN** live practice displays fretboard cells
- **THEN** hit cells use `--mint` filled background with contrast-safe `--mint-ink` text, next cells use `--paper` background with 3px `--coral` outline and `--coral-ink` text in Nunito 800, and remaining scale cells use the peri dot state

#### Scenario: Pause and restart actions render
- **WHEN** live practice is displayed
- **THEN** it shows a 50/50 action row with secondary "Pause" and primary "Restart"

### Requirement: Scale practice copy ownership
The scale setup and live practice flows SHALL source labels and action copy from `src/lib/content` through `WORDS`, while scale formulas, note sequences, root keys, note letters, progress counts, and fretboard maps remain generated by their owning music or practice-state modules.

#### Scenario: Scale copy is reviewed
- **WHEN** scale setup, live practice, next-note, progress, REC, pause, restart, or completion UI is displayed
- **THEN** the rendered copy matches the OpenSpec strings represented in `WORDS`

### Requirement: Practice completion
The live practice flow SHALL show a success state after the selected scale sequence is completed.

#### Scenario: Sequence complete
- **WHEN** the user correctly plays the full expected sequence
- **THEN** the app shows "Nice run! 🎉" feedback, pulses the fretboard border with mint styling, and allows the user to restart the run

### Requirement: Scale sequence behavior
The scale practicer SHALL track expected scale sequences for the selected scale and root, with ascending practice required in v1 and descending practice controlled by future settings.

#### Scenario: G major sequence
- **WHEN** the user selects G major for practice
- **THEN** the expected ascending sequence is G, A, B, C, D, E, F#, G
