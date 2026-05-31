## ADDED Requirements

### Requirement: Self-contained visual contract
The OpenSpec artifacts SHALL contain enough visual and interaction detail to recreate the SoundStage v1 design if the external design handoff files are unavailable.

#### Scenario: External handoff is unavailable
- **WHEN** an implementer has only the OpenSpec change artifacts
- **THEN** they can recreate the v1 screens, responsive layout, visual tokens, tool accents, copy, motion timings, and scope boundaries from the specs

#### Scenario: Prototype files are available
- **WHEN** prototype HTML files exist beside the app
- **THEN** the implementation treats them as visual references and still treats the OpenSpec requirements as the binding product contract

### Requirement: Screen inventory
The v1 design contract SHALL cover Home, Mic Permission, Tuner, Metronome, Scale Setup, Scale Live, Settings, Mic Denied, Unsupported Browser, Microphone Off, and the quiet/noisy listening behavior.

#### Scenario: Screen list is reviewed
- **WHEN** implementation scope is planned
- **THEN** every listed screen or listening behavior is represented by either a dedicated route, a shared state component, or a tool state within the v1 app

### Requirement: UI Copy Catalog
The app SHALL mirror exact v1 user-visible copy from OpenSpec through `src/lib/content` and its exported `WORDS` catalog.

#### Scenario: Copy catalog is reviewed
- **WHEN** implementation copy is audited
- **THEN** labels, headings, button text, document titles, helper text, ARIA labels, placeholder prose, and status copy match the OpenSpec strings through `WORDS`

#### Scenario: Domain values are reviewed
- **WHEN** route structure, icons, colors, numeric values, note values, tempo values, or scale formulas are audited
- **THEN** those generated or structural values remain owned by their domain modules rather than the UI Copy Catalog

### Requirement: Breakpoints and layout frames
The app SHALL use three responsive frames: mobile at 720px and below, tablet from 721px through 1199px, and desktop at 1200px and above.

#### Scenario: Mobile frame
- **WHEN** the viewport is 720px wide or narrower
- **THEN** screens use a single-column layout, microphone permission appears as a bottom sheet, and the desktop sidebar is hidden

#### Scenario: Tablet frame
- **WHEN** the viewport is between 721px and 1199px wide
- **THEN** screens use a single-column layout with more whitespace, microphone permission appears as a centered modal, and home uses a three-column tile grid

#### Scenario: Desktop frame
- **WHEN** the viewport is at least 1200px wide
- **THEN** the app uses a 220px slim left sidebar, a centered main canvas, a standard tool max-width of 560px, a wider tool max-width of 720px where the screen needs room, and a launcher max-width of 840px when the five-card desktop launcher needs more readable labels

### Requirement: Color tokens
The app SHALL define and use these exact color tokens as the v1 palette: `--paper: #FFFBF5`, `--paper-soft: #FFF6E8`, `--paper-sink: #F5EDDD`, `--ink: #1F1B17`, `--ink-2: #4A4338`, `--ink-3: #8A8170`, `--hairline: #E5DAC3`, `--coral: oklch(0.72 0.15 35)`, `--coral-soft: oklch(0.92 0.06 35)`, `--coral-ink: oklch(0.40 0.12 35)`, `--sun: oklch(0.86 0.14 85)`, `--sun-soft: oklch(0.95 0.06 85)`, `--sun-ink: oklch(0.42 0.09 85)`, `--mint: oklch(0.82 0.12 160)`, `--mint-soft: oklch(0.94 0.05 160)`, `--mint-ink: oklch(0.38 0.09 160)`, `--peri: oklch(0.78 0.11 260)`, `--peri-soft: oklch(0.94 0.04 260)`, `--peri-ink: oklch(0.38 0.09 260)`, `--rose: oklch(0.72 0.16 15)`, `--rose-soft: oklch(0.94 0.05 15)`, and `--rose-ink: oklch(0.42 0.13 15)`.

#### Scenario: Token audit
- **WHEN** global styles are reviewed
- **THEN** every listed token exists with the specified value and the app background uses `--paper`

### Requirement: Tool color assignments
The app SHALL use fixed tool colors: Tuner uses `--coral` and `--coral-soft`, Metronome uses `--sun` and `--sun-soft`, Scales uses `--peri` and `--peri-soft`, Chords uses `--mint` and `--mint-soft`, and Ear Training uses `--rose` and `--rose-soft`.

#### Scenario: Tool appears in multiple contexts
- **WHEN** a tool appears in launcher tiles, navigation, or its own screen
- **THEN** the same assigned accent family is used consistently

### Requirement: Typography contract
The app SHALL use Fraunces as display type, Nunito as UI type, and JetBrains Mono as mono type, served as self-hosted local font assets so the typography renders consistently and works offline with no external font requests.

#### Scenario: Fonts are self-hosted
- **WHEN** the app loads its fonts
- **THEN** Fraunces, Nunito, and JetBrains Mono are declared with `@font-face` pointing to self-hosted `.woff2` assets on the app's own origin (no external font CDN), each with a system fallback chain and `font-display: swap` so text stays visible while the asset loads

#### Scenario: Text roles render
- **WHEN** headings, body text, labels, buttons, captions, and readouts render
- **THEN** headings and large numeric readouts use Fraunces, body and controls use Nunito, and eyebrow labels, BPM suffixes, cents readouts, and step numerals use JetBrains Mono

#### Scenario: Type scale renders
- **WHEN** the app renders the main v1 screens
- **THEN** hero display text uses 56px Fraunces 600 with 1.05 line-height and 0 letter spacing, section headings use 32-36px Fraunces 600, card headings use 26-28px Fraunces 600, body text uses 15px Nunito 400, captions use 13px Nunito 400 in `--ink-3`, and eyebrow labels use 11px uppercase JetBrains Mono with 0.14em letter spacing

### Requirement: Shape, spacing, and shadows
The app SHALL use the handoff shape and shadow tokens: `--r-xs: 8px`, `--r-sm: 12px`, `--r-md: 18px`, `--r-lg: 24px`, `--r-xl: 32px`, `--shadow-sm: 0 1px 2px rgba(31,27,23,0.06), 0 1px 0 rgba(31,27,23,0.04)`, `--shadow-md: 0 2px 6px rgba(31,27,23,0.08), 0 8px 24px rgba(31,27,23,0.06)`, and `--shadow-lg: 0 12px 40px rgba(31,27,23,0.12)`.

#### Scenario: Component geometry is reviewed
- **WHEN** tiles, cards, modals, sheets, chips, fret cells, and primary tool cards are inspected
- **THEN** they use the specified radius scale and shadow scale according to their component role

#### Scenario: Spacing rhythm is reviewed
- **WHEN** component spacing is reviewed
- **THEN** it uses the handoff spacing values 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 56, and 64px as the recurring spacing palette

### Requirement: Shared control styling
The app SHALL use handoff button and top-navigation styling across tools.

#### Scenario: Primary button renders
- **WHEN** a primary action button is displayed
- **THEN** it uses inline-flex alignment, Nunito 700 at 15px, 14px by 20px padding, pill radius, `--coral` background, contrast-safe `--on-primary` text, `--shadow-sm`, and at least 48px height

#### Scenario: Secondary and ghost buttons render
- **WHEN** secondary and ghost buttons are displayed
- **THEN** secondary buttons use `--paper-soft` background with hairline inset border and ink text, while ghost buttons use transparent background and `--ink-2` text

#### Scenario: Tool top bar renders
- **WHEN** a tool screen displays a top bar
- **THEN** it uses a minimum 32px height, a 36px circular `--paper-soft` back button, an accessible page heading centered between equal side slots in Nunito 700 at 15px, and a right-side action or spacer

### Requirement: Accessibility baseline
The app SHALL keep the static UI foundation accessible enough that later logic can attach behavior without replacing component markup.

#### Scenario: Document and navigation semantics render
- **WHEN** a route is displayed
- **THEN** the document title identifies the current SoundStage route, desktop navigation exposes distinct tool and settings landmarks, and the active navigation item exposes `aria-current`

#### Scenario: Selection state renders
- **WHEN** segmented controls, scale chips, root keys, switches, or fretboard cells display selected or stateful information
- **THEN** their selected, checked, or cell state is available through accessible roles or ARIA attributes rather than color alone

#### Scenario: Keyboard focus renders
- **WHEN** a keyboard user focuses a link, button, tile, chip, or switch
- **THEN** the control displays a visible focus ring that is distinct from hover and active styling

### Requirement: Motion timings
The app SHALL use the handoff motion timings: modal or sheet open uses 220ms `cubic-bezier(0.32, 0.72, 0, 1)`, modal or sheet dismiss uses 180ms ease-out, desktop tile hover uses 160ms ease-out translate and shadow, button press uses 80ms scale to 0.97, tuner needle rotation uses 120ms ease-out, switch toggle uses 180ms ease-out, and scale REC dot pulse uses a 1.2s opacity loop.

#### Scenario: Interactive element animates
- **WHEN** the user opens a modal, dismisses a sheet, hovers a desktop tile, presses a button, receives tuner updates, toggles a switch, or views the scale recording pill
- **THEN** the relevant animation uses the specified duration and motion curve

### Requirement: Icon and asset contract
The app SHALL provide two-tone SVG icons for `tuner`, `metronome`, `scale`, `chord`, `ear`, `mic`, `mic_off`, `minus`, `plus`, `back`, `settings`, `home`, and `check`, using a soft accent fill and current-color outline stroke.

#### Scenario: Icon renders with tone
- **WHEN** a tool icon renders with an assigned tone
- **THEN** the icon uses the tone as the soft filled shape and current text color for its outline strokes

### Requirement: v1 settled decisions
The app SHALL preserve the settled v1 decisions: responsive web app, anonymous local-first account model, offline chord-library direction, guitar-only instrument model, tile-grid home layout, friendly microphone pre-prompt, auto-detect tuner default, circular arc tuner visualization, Pulse/Beats/Wave metronome visualization, fretboard-only scale scoring, Fraunces/Nunito/JetBrains Mono typography, warm paper multi-accent palette, and two-tone iconography.

#### Scenario: Product scope is challenged during implementation
- **WHEN** an implementation choice would replace one of the settled v1 decisions
- **THEN** the choice is treated as outside the approved v1 design contract unless the OpenSpec change is explicitly updated

### Requirement: v1 out-of-scope areas
The v1 app SHALL keep full chord detail screens, full ear-training screens, onboarding, manual per-string tuner mode, sharp and flat root picker entries, fully designed time-signature picker UI, fully designed click-sound picker UI, and bespoke tablet/desktop variants for the unsupported-browser error state outside the required design scope.

#### Scenario: Out-of-scope route is opened
- **WHEN** the user opens an out-of-scope area during v1
- **THEN** the app presents either a placeholder or a scaled pattern from the existing design contract rather than inventing a complete new workflow
