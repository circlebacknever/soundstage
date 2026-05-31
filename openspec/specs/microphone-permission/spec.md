# microphone-permission Specification

## Purpose
TBD - created by archiving change implement-soundstage-v1. Update Purpose after archive.
## Requirements
### Requirement: Friendly microphone pre-prompt
The system SHALL show a SoundStage microphone pre-prompt before requesting browser microphone access for Tuner or Scale Practice.

#### Scenario: Mobile pre-prompt appears as a bottom sheet
- **WHEN** a mobile user opens a mic-required tool without prior granted access
- **THEN** the app dims the underlying tool page to approximately 0.5 opacity with grayscale and displays the microphone explanation as a bottom sheet with 24px padding and 24px rounded top corners

#### Scenario: Larger pre-prompt appears as a modal
- **WHEN** a tablet or desktop user opens a mic-required tool without prior granted access
- **THEN** the app dims the background with `rgba(31,27,23,0.45)`, applies 3px blur, and displays a 440px centered modal with 32px padding, `--r-lg` corners, and `--shadow-lg`

#### Scenario: Pre-prompt content renders
- **WHEN** the microphone pre-prompt is displayed
- **THEN** it shows a coral-soft microphone illustration with two expanding rings, heading "Can we hear you?", centered body text "The tuner listens through your mic to tell you if you're sharp or flat.", trust items "Processed on this device only", "Nothing is recorded or uploaded", and "You can revoke in settings anytime", primary button "Allow microphone", and ghost button "Not right now"

#### Scenario: Pre-prompt illustration sizes
- **WHEN** the pre-prompt is displayed on mobile
- **THEN** the microphone illustration uses an 80px circle

#### Scenario: Modal illustration sizes
- **WHEN** the pre-prompt is displayed on tablet or desktop
- **THEN** the microphone illustration uses a 96px circle

#### Scenario: User allows microphone
- **WHEN** the user activates the allow microphone action
- **THEN** the app calls `navigator.mediaDevices.getUserMedia` with audio constraints that disable browser voice-call DSP and starts the relevant audio engine after access is granted

#### Scenario: User declines pre-prompt
- **WHEN** the user activates the decline action in the pre-prompt
- **THEN** the app dismisses the prompt and returns to the home launcher

### Requirement: Permission state handling
The system SHALL track microphone permission as unknown, pending, granted, or denied for the current browser session and store only a local consent hint.

#### Scenario: Permission state shape is used
- **WHEN** microphone permission is represented in tool state
- **THEN** it uses `unknown`, `pending`, `granted`, or `denied`

#### Scenario: Browser denies access
- **WHEN** `getUserMedia` rejects with a permission denial
- **THEN** the app records denied state and routes the tool to the Mic Denied error state

#### Scenario: Stored consent is only a hint
- **WHEN** local storage says microphone access was granted previously
- **THEN** the app still relies on the browser permission request or stream result before starting mic-driven detection

#### Scenario: Returning granted user skips the pre-prompt
- **WHEN** local storage records prior granted consent and the microphone setting is on
- **THEN** the app does not show the pre-prompt again and re-acquires the microphone directly, showing the tool's listening view while the stream is acquired

#### Scenario: Pre-prompt is shown only before consent is recorded
- **WHEN** no microphone consent has been recorded yet (unknown)
- **THEN** the pre-prompt is shown, and granting or denying persists the outcome locally so later visits do not show the pre-prompt again (a previously denied mic opens directly in the Mic Denied state)

#### Scenario: First paint shows the listening view, not the prompt
- **WHEN** a mic-required tool first renders, including server-side, before stored consent is resolved on the client
- **THEN** it shows the listening view ("Play a note") and resolves consent on mount, so the pre-prompt or a silent re-acquire only happens client-side after the first paint and the prompt never flashes during initial render

### Requirement: Microphone flow copy ownership
The microphone flow SHALL source pre-prompt and error-state copy from `src/lib/content` through `WORDS`.

#### Scenario: Microphone copy is reviewed
- **WHEN** the pre-prompt or any microphone error state is displayed
- **THEN** headings, body prose, trust items, step text, button labels, and action labels match the OpenSpec strings represented in `WORDS`

### Requirement: Blocking microphone error states
The system SHALL provide full-screen states that replace the tool when the microphone cannot be used: denied access, an unsupported browser, and a microphone turned off in settings.

#### Scenario: Mic denied copy renders
- **WHEN** microphone access is denied
- **THEN** the app displays title "Mic is blocked", body "Your browser blocked mic access for this site. Three quick steps to fix:", steps "Tap the lock icon in the address bar", "Set Microphone -> Allow", and "Reload the page", primary action "Try again", and ghost action "Use tuning notes instead"

#### Scenario: Unsupported browser
- **WHEN** `navigator.mediaDevices.getUserMedia` is unavailable
- **THEN** the app displays title "This browser can't listen", body "Mic features need a modern browser. Try Chrome, Safari, or Firefox to use the tuner and scales.", and primary action "Browse the chord library"

#### Scenario: Microphone turned off in settings
- **WHEN** the microphone setting is turned off
- **THEN** the app displays title "Microphone is off", body "Turn microphone access back on in Settings to use the tuner and scale practice.", and primary action "Open settings"

#### Scenario: Error illustration style
- **WHEN** a blocking error state is displayed
- **THEN** it uses a centered 120px illustration circle, with rose styling for mic denied, paper-sink styling for unsupported browser, and peri styling for the microphone-off state

#### Scenario: Quiet or noisy input is not a state
- **WHEN** the microphone is listening but the signal is silent or too noisy to detect a pitch
- **THEN** the tool stays on its listening view showing the "Play a note" prompt and never escalates to a separate silent or noisy state

