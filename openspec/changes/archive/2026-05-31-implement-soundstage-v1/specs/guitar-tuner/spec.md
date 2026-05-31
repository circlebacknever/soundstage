## ADDED Requirements

### Requirement: Live tuner route
The system SHALL provide a `/tuner` route that requests microphone access when needed and displays the live tuner interface after access is granted.

#### Scenario: Tuner starts after mic grant
- **WHEN** the user grants microphone access from the tuner flow
- **THEN** the app starts pitch detection and displays live note and cents information

#### Scenario: Tuner top bar renders
- **WHEN** the tuner route is displayed
- **THEN** the top bar shows a back button, title "Tuner", and a small "Auto" status pill

#### Scenario: Tuner state shape is available
- **WHEN** tuner UI state is represented
- **THEN** it includes current pitch with note and cents, string states for `E_low`, `A`, `D`, `G`, `B`, and `E_high`, active string, and completion feedback

#### Scenario: Microphone session owns browser audio
- **WHEN** the tuner is listening
- **THEN** microphone permission, Web Audio context setup, analyser frames, and stable pitch gating live behind the shared audio session rather than inside tuner UI state

### Requirement: Tuner gauge and readout
The tuner SHALL display the handoff circular arc gauge, needle, flat/sharp labels, large note letter, and cents guidance.

#### Scenario: Gauge visual details render
- **WHEN** the tuner card is displayed
- **THEN** it uses `--coral-soft` background, `--r-lg` corners, 32px padding, approximately 70 percent of vertical space, a 180-degree arc from 9 o'clock to 3 o'clock, a 10px `--paper` track, a mint in-tune zone at +/- 5 cents, a 4px `--coral` needle rotating from center-bottom, and a center pivot with an 8px `--ink` circle plus 3px white inset

#### Scenario: Gauge labels render
- **WHEN** the tuner gauge is displayed
- **THEN** it shows "♭ flat" and "sharp ♯" labels at the arc ends in JetBrains Mono 10px using `--coral-ink`

#### Scenario: Readout typography renders
- **WHEN** pitch information is displayed
- **THEN** the note letter uses Fraunces 600 at 104px and the cents readout uses uppercase JetBrains Mono 13px in `--coral-ink`

#### Scenario: No pitch waits for input
- **WHEN** no usable pitch estimate is available
- **THEN** the tuner displays neutral listening copy instead of in-tune guidance for the default E target

#### Scenario: Brief pitch dropout keeps the readout readable
- **WHEN** a usable pitch estimate is followed by a brief missing estimate
- **THEN** the tuner keeps the last readable note and cents guidance visible for approximately 4000ms without advancing the active string

#### Scenario: Same-string cents changes are dampened
- **WHEN** consecutive usable pitch estimates are for the same standard string
- **THEN** the tuner dampens the cents and needle movement so the readout remains legible while the string rings

#### Scenario: Readout names the played note but measures against the target
- **WHEN** the detector reports a usable pitch while a string is the active tuning target
- **THEN** the large note letter names the nearest chromatic note actually played (rolling over, for example E to F, once the pitch passes the halfway point), while the cents, needle, and guidance band are all measured against the active string, and the cents number is hidden once the played note has rolled past the target so the readout never shows a large offset

#### Scenario: A different note never reads as in tune for the target
- **WHEN** the player sounds a note away from the active string, including a perfectly tuned but wrong note such as F# while tuning low E
- **THEN** the needle sits away from the in-tune zone and the guidance reads sharp or flat toward the target, rather than showing the in-tune zone for the wrong note

#### Scenario: Readout position stays stable as values change
- **WHEN** the cents value or guidance band changes between frames
- **THEN** the readout does not shift: the cents number (tabular figures) is right-aligned up to the centre line and the guidance band is left-aligned from it, so neither a digit change nor a band change reflows the other half

#### Scenario: Sharp note updates gauge
- **WHEN** the detector reports a pitch more than 5 cents sharp of the active string
- **THEN** the tuner angles the needle toward sharp and labels the reading "sharp" (or "way sharp"), letting the needle and the gauge's flat/sharp labels show which way to tune

#### Scenario: In-tune note updates gauge
- **WHEN** the detected pitch is within 5 cents of the active string
- **THEN** the tuner positions the needle in the in-tune zone and displays in-tune guidance

### Requirement: Standard tuning string progress
The tuner SHALL track standard guitar tuning in order: low E, A, D, G, B, high E.

#### Scenario: Strings row renders
- **WHEN** the tuner is displayed
- **THEN** the app shows eyebrow label "Standard tuning" and a six-cell grid for low E, A, D, G, B, and high E

#### Scenario: String chip states render
- **WHEN** string chips are displayed
- **THEN** untouched chips use `--paper` background, `--ink-2` text, and hairline border; done chips use `--mint-soft` background, `--mint-ink` text, and `--mint` border; active chips use `--coral` background, white text, and a soft coral glow shadow

#### Scenario: String chips select active target
- **WHEN** the user selects a standard tuning string chip
- **THEN** the tuner makes that string active, clears any current pitch hold timing, and allows that string to be tuned next

#### Scenario: String labels render
- **WHEN** low E and high E chips are displayed in the untouched state
- **THEN** each chip shows the note letter in Nunito 800 at 17px and a LOW or HIGH label in JetBrains Mono 9px using `--ink-3`

#### Scenario: String labels stay legible when selected or done
- **WHEN** the low E or high E chip is the active (coral) or done (mint) chip
- **THEN** its LOW or HIGH sublabel uses the chip's own ink (`--on-primary` on the active coral chip, `--mint-ink` on the done chip) so it keeps sufficient contrast rather than the muted `--ink-3` that is illegible on those backgrounds

#### Scenario: Active string is held in tune
- **WHEN** the active string remains within 5 cents for at least 800ms
- **THEN** the tuner marks that string done and advances the active state to the next string

#### Scenario: Other strings do not complete the active string
- **WHEN** the user plays a different standard string in tune while low E is active
- **THEN** the tuner shows the played note in the readout and keeps low E active

#### Scenario: All strings complete
- **WHEN** all six strings are marked done
- **THEN** the tuner displays "Tuned ✓" feedback for approximately 1.5 seconds and resets the active string to low E

### Requirement: Tuner copy ownership
The tuner SHALL source labels and guidance prose from `src/lib/content` through `WORDS`, while pitch-derived note and cents values remain generated by the tuner and music modules.

#### Scenario: Tuner copy is reviewed
- **WHEN** the tuner top bar, gauge labels, string row, status guidance, or completion feedback is displayed
- **THEN** the rendered copy matches the OpenSpec strings represented in `WORDS`

### Requirement: Tuner status copy
The tuner SHALL classify the cents offset from the active string into way flat, flat, in tune, sharp, and way sharp guidance bands. The band label is the concise direction word, since the needle and the gauge's flat/sharp labels already show which way to tune.

#### Scenario: Large sharp offset
- **WHEN** the cents offset is +25 or higher
- **THEN** the tuner displays "way sharp"

#### Scenario: Small flat offset
- **WHEN** the cents offset is from -24 through -6
- **THEN** the tuner displays "flat"

#### Scenario: In tune offset
- **WHEN** the cents offset is from -5 through +5
- **THEN** the tuner displays "in tune ✓"

#### Scenario: Large flat offset
- **WHEN** the cents offset is -25 or lower
- **THEN** the tuner displays "way flat"

#### Scenario: Small sharp offset
- **WHEN** the cents offset is from 6 through 24
- **THEN** the tuner displays "sharp"

### Requirement: Tuner update cadence
The tuner SHALL update the needle and note display at least 30 frames per second while usable pitch estimates are available.

#### Scenario: Live pitch stream is active
- **WHEN** the detector is returning accepted pitch estimates
- **THEN** the tuner keeps the visual readout responsive at 30fps or faster
