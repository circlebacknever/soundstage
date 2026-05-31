## ADDED Requirements

### Requirement: Responsive app shell
The system SHALL provide a responsive SoundStage shell using the handoff breakpoints: mobile at 720px and below, tablet from 721px through 1199px, and desktop at 1200px and above.

#### Scenario: Desktop navigation appears on the left
- **WHEN** the viewport is at least 1200px wide
- **THEN** the app displays a persistent slim left sidebar with tool navigation and a centered main tool canvas

#### Scenario: Mobile and tablet use single-column tool pages
- **WHEN** the viewport is below 1200px wide
- **THEN** the app hides the desktop sidebar and displays each tool in a single-column layout

#### Scenario: Desktop tool canvas is centered
- **WHEN** a desktop user opens a standard-width tool
- **THEN** the main content area centers the tool canvas with a max-width of 560px, wider tool views can use 720px, and the desktop launcher can use up to 840px to keep five tool labels readable

### Requirement: Home launcher
The system SHALL provide a launcher home page for the five v1 tool entries: Tuner, Metronome, Scales, Chords, and Ear Training.

#### Scenario: Mobile launcher uses a tile grid
- **WHEN** the user opens the home page on a mobile viewport
- **THEN** the app displays the eyebrow "Good afternoon", the heading "What'll we practice today?", and a two-column colored tile grid with the fifth tile spanning both columns

#### Scenario: Tablet launcher uses three columns
- **WHEN** the user opens the home page on a tablet viewport
- **THEN** the app displays the same greeting at a larger size and a three-column tile grid with a dashed sixth placeholder slot labeled "More soon"

#### Scenario: Desktop launcher uses horizontal cards
- **WHEN** the user opens the home page on a desktop viewport
- **THEN** the app displays the desktop sidebar and five launcher cards in a single horizontal row with 4/5 aspect ratio, readable tool labels, and hover lift

#### Scenario: Launcher stays clean
- **WHEN** the home launcher renders on mobile
- **THEN** the app excludes bottom navigation and presents the page as a launcher rather than a dashboard

### Requirement: Launcher tile specification
Each launcher tile SHALL use its tool's soft accent background, `--r-lg` 24px radius, `--shadow-sm`, no border, top-left icon sized 24-38px, bottom-left tool name in Fraunces 600 at 20-24px, and subtitle in Nunito 400 at 13px using `--ink-2`.

#### Scenario: Tile geometry follows breakpoint
- **WHEN** launcher tiles render on mobile or tablet
- **THEN** they use a 1/1 aspect ratio, except the fifth mobile tile spans both columns

#### Scenario: Desktop tile hover
- **WHEN** a desktop pointer hovers over a launcher tile
- **THEN** the tile translates up by 2px over 160ms and its shadow increases to `--shadow-md`

### Requirement: Launcher tool labels
Launcher tiles SHALL use these labels and subtitles: Tuner with "Get in tune", Metronome with "Keep time", Scales with "Play & learn", Chords with "Learn shapes", and Ear Training with "Train your ear".

#### Scenario: Tile text renders
- **WHEN** the launcher is displayed
- **THEN** each tile uses the specified tool name and subtitle

### Requirement: App shell copy ownership
The app shell SHALL source home, launcher, navigation, document title, and planned-placeholder copy from `src/lib/content` through `WORDS`.

#### Scenario: App shell copy is reviewed
- **WHEN** the home launcher, desktop sidebar, route document title, or planned placeholder is displayed
- **THEN** the rendered copy matches the OpenSpec strings represented in `WORDS`

### Requirement: Design tokens and icon system
The system SHALL use the handoff palette, type roles, radius scale, shadow scale, spacing rhythm, and two-tone icon geometry as the visual source of truth.

#### Scenario: Tool accents remain consistent
- **WHEN** a tool appears in navigation, launcher cards, or tool UI
- **THEN** the tool uses its assigned accent family: coral for Tuner, sun for Metronome, peri for Scales, mint for Chords, and rose for Ear Training

#### Scenario: Typography follows handoff roles
- **WHEN** headings, readouts, body text, captions, and machine labels are rendered
- **THEN** display text uses Fraunces, UI text uses Nunito, and mono labels use JetBrains Mono or their configured local fallbacks

### Requirement: Tool routes
The system SHALL expose routes for `/`, `/tuner`, `/metronome`, `/scales`, `/scales/practice`, `/chords`, `/ear`, and `/settings`.

#### Scenario: A launcher tile opens its tool
- **WHEN** the user activates a launcher tile
- **THEN** the app navigates to the corresponding tool route

#### Scenario: Planned tools use v1 placeholders
- **WHEN** the user opens Chords or Ear Training during v1
- **THEN** the app displays a visually consistent placeholder page that preserves navigation and explains the workflow is coming later

### Requirement: Planned tools are visually de-emphasized
Planned tools (Chords, Ear Training) SHALL appear in the launcher and desktop sidebar but visually de-emphasized, so a user can tell available tools apart from planned ones at a glance.

#### Scenario: Planned launcher tiles are muted and marked
- **WHEN** the home launcher renders a planned tool tile
- **THEN** the tile drops its bright accent background for a muted neutral treatment, dims its icon and labels, and shows the "Coming later" marker

#### Scenario: Planned sidebar items are muted
- **WHEN** the desktop sidebar renders a planned tool item
- **THEN** the item uses muted text and a dimmed icon rather than the standard available-tool styling

#### Scenario: Planned tools stay reachable
- **WHEN** the user activates a planned launcher tile or sidebar item
- **THEN** the app still opens its v1 placeholder page explaining the workflow is coming later

### Requirement: Desktop sidebar contents
The desktop sidebar SHALL contain the SoundStage brand, nav items for Home, Tuner, Metronome, Scales, Chords, and Ear Training, and a Settings item placed near the bottom.

#### Scenario: Sidebar item is active
- **WHEN** the user is on a desktop tool route
- **THEN** the corresponding sidebar item uses the active paper background and shadow styling
