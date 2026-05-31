# Content Agent Instructions

This folder owns SoundStage user-visible copy. Put labels, headings, button text, document titles, helper text, ARIA labels, placeholder prose, status prose, and static guidance text here.

## Boundary

Export the copy catalog as `WORDS`. The screaming case is deliberate: mildly deranged and still readable. Use it because it is memorable at the call site, easy to search, and clear about ownership.

Keep route paths, icon IDs, accent tokens, CSS tokens, numeric readouts, note letters, cents values, BPM values, scale formulas, and generated music facts in their domain modules. `WORDS` should hold authored interface language, while `src/lib/app`, `src/lib/music`, `src/lib/audio`, and `src/lib/state` keep their mechanisms.

## Naming

Prefer names with controlled strangeness when they stay readable. `WORDS.tuner.tuneAction.tuneDown` is acceptable because it is vivid and precise. Flatter aliases such as `uiCopy`, `text`, `strings`, and `contentMap` are weaker because they hide the owner behind beige vocabulary.

Use this recipe when naming content structures:

1. Start with the real object: words, headings, actions, guidance, errors, labels.
2. Pick a short concrete noun or verb.
3. Raise the temperature by one notch only when the call site remains obvious.

Examples:

- `WORDS.home.heading`
- `WORDS.metronome.actions.start`
- `WORDS.tuner.tuneAction.tuneUp`
- `WORDS.microphone.errors.denied.title`

Avoid grand machinery names such as `copyManagementService`, `textResourceMap`, `uiContentRegistry`, or `messageOrchestrator`. They imply a machine larger than the job. SoundStage names should feel like a competent person named the thing after looking directly at it.

## Tests

Test `WORDS` through its public export. The focused tests should assert exact v1 copy from OpenSpec and should make accidental wording drift obvious.
