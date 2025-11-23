<script lang="ts">
  import { onDestroy } from 'svelte';

  // Audio context and nodes
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;
  let mediaStream: MediaStream | null = null;

  // Chord finder state
  let isListening = $state(false);
  let detectedChord = $state('--');
  let detectedNotes = $state<string[]>([]);
  let chordQuality = $state('');
  let rafId: number | null = null;

  // FFT configuration for polyphonic detection
  const fftSize = 8192; // Larger FFT for better frequency resolution
  let frequencyData: Uint8Array;
  let frequencyBuffer: Float32Array;

  // Note names
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Detection thresholds
  const PEAK_THRESHOLD = 140; // Minimum amplitude for a peak to be considered (0-255)
  const MIN_PEAK_DISTANCE = 3; // Minimum distance between peaks in FFT bins
  const FREQUENCY_TOLERANCE = 20; // Hz tolerance for note matching
  const MIN_NOTES_FOR_CHORD = 2; // Minimum notes to identify a chord

  // Smoothing for stability
  let noteHistory: string[][] = [];
  const HISTORY_SIZE = 8;

  /**
   * Comprehensive chord database
   * Maps note patterns to chord names
   */
  const chordDatabase: Record<string, { name: string; quality: string }[]> = {
    // Major chords (root, major third, perfect fifth)
    '0-4-7': [{ name: '', quality: 'Major' }],

    // Minor chords (root, minor third, perfect fifth)
    '0-3-7': [{ name: 'm', quality: 'Minor' }],

    // Diminished (root, minor third, diminished fifth)
    '0-3-6': [{ name: 'dim', quality: 'Diminished' }],

    // Augmented (root, major third, augmented fifth)
    '0-4-8': [{ name: 'aug', quality: 'Augmented' }],

    // Suspended chords
    '0-2-7': [{ name: 'sus2', quality: 'Suspended 2nd' }],
    '0-5-7': [{ name: 'sus4', quality: 'Suspended 4th' }],

    // Seventh chords
    '0-4-7-10': [{ name: '7', quality: 'Dominant 7th' }],
    '0-4-7-11': [{ name: 'maj7', quality: 'Major 7th' }],
    '0-3-7-10': [{ name: 'm7', quality: 'Minor 7th' }],
    '0-3-6-9': [{ name: 'dim7', quality: 'Diminished 7th' }],
    '0-3-6-10': [{ name: 'm7♭5', quality: 'Half-Diminished 7th' }],
    '0-4-8-10': [{ name: '7♯5', quality: 'Augmented 7th' }],

    // Extended chords
    '0-4-7-10-14': [{ name: '9', quality: 'Dominant 9th' }],
    '0-4-7-11-14': [{ name: 'maj9', quality: 'Major 9th' }],
    '0-3-7-10-14': [{ name: 'm9', quality: 'Minor 9th' }],

    // Added tone chords
    '0-4-7-9': [{ name: '6', quality: 'Major 6th' }],
    '0-3-7-9': [{ name: 'm6', quality: 'Minor 6th' }],
    '0-4-7-14': [{ name: 'add9', quality: 'Major add 9' }],
    '0-3-7-14': [{ name: 'madd9', quality: 'Minor add 9' }],

    // Power chord (just root and fifth)
    '0-7': [{ name: '5', quality: 'Power Chord' }],

    // Octaves
    '0-12': [{ name: ' (octave)', quality: 'Octave' }],
  };

  /**
   * Convert frequency to note number (0 = C0)
   */
  function frequencyToNoteNumber(frequency: number): number {
    return Math.round(12 * Math.log2(frequency / 16.35));
  }

  /**
   * Convert note number to note name with octave
   */
  function noteNumberToName(noteNumber: number): string {
    const octave = Math.floor(noteNumber / 12);
    const note = noteNames[noteNumber % 12];
    return `${note}${octave}`;
  }

  /**
   * Get just the note name without octave
   */
  function getNoteWithoutOctave(noteName: string): string {
    return noteName.replace(/[0-9]/g, '');
  }

  /**
   * Calculate semitone difference between two notes
   */
  function semitoneDifference(note1: number, note2: number): number {
    return ((note2 - note1) % 12 + 12) % 12;
  }

  /**
   * Find peaks in the frequency spectrum
   */
  function findPeaks(spectrum: Uint8Array): number[] {
    const peaks: number[] = [];

    for (let i = MIN_PEAK_DISTANCE; i < spectrum.length - MIN_PEAK_DISTANCE; i++) {
      const current = spectrum[i];

      // Check if this is a local maximum above threshold
      if (current < PEAK_THRESHOLD) continue;

      let isPeak = true;
      for (let j = 1; j <= MIN_PEAK_DISTANCE; j++) {
        if (spectrum[i - j] >= current || spectrum[i + j] >= current) {
          isPeak = false;
          break;
        }
      }

      if (isPeak) {
        peaks.push(i);
      }
    }

    // Sort peaks by amplitude (strongest first) and take top 10
    return peaks
      .sort((a, b) => spectrum[b] - spectrum[a])
      .slice(0, 10);
  }

  /**
   * Convert FFT bin index to frequency
   */
  function binToFrequency(bin: number, sampleRate: number, fftSize: number): number {
    return (bin * sampleRate) / fftSize;
  }

  /**
   * Refine peak frequency using parabolic interpolation
   */
  function refinePeakFrequency(
    spectrum: Uint8Array,
    peakBin: number,
    sampleRate: number,
    fftSize: number
  ): number {
    if (peakBin <= 0 || peakBin >= spectrum.length - 1) {
      return binToFrequency(peakBin, sampleRate, fftSize);
    }

    const alpha = spectrum[peakBin - 1];
    const beta = spectrum[peakBin];
    const gamma = spectrum[peakBin + 1];

    const offset = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
    const refinedBin = peakBin + offset;

    return binToFrequency(refinedBin, sampleRate, fftSize);
  }

  /**
   * Filter out harmonics and keep only fundamental frequencies
   */
  function filterHarmonics(frequencies: number[]): number[] {
    const fundamentals: number[] = [];

    for (const freq of frequencies) {
      let isFundamental = true;

      // Check if this frequency is a harmonic of any lower frequency
      for (const fundamental of fundamentals) {
        const ratio = freq / fundamental;
        // Check if it's close to a whole number ratio (2x, 3x, 4x, etc.)
        if (Math.abs(ratio - Math.round(ratio)) < 0.1 && ratio > 1.5) {
          isFundamental = false;
          break;
        }
      }

      if (isFundamental) {
        fundamentals.push(freq);
      }
    }

    return fundamentals;
  }

  /**
   * Detect multiple notes from frequency spectrum
   */
  function detectNotes(spectrum: Uint8Array, sampleRate: number): string[] {
    // Find peaks in the spectrum
    const peakBins = findPeaks(spectrum);

    if (peakBins.length === 0) return [];

    // Convert peaks to frequencies
    const frequencies = peakBins.map((bin) =>
      refinePeakFrequency(spectrum, bin, sampleRate, fftSize)
    );

    // Filter out harmonics
    const fundamentalFreqs = filterHarmonics(frequencies);

    // Convert to note numbers and names
    const notes = fundamentalFreqs
      .filter((freq) => freq >= 80 && freq <= 1200) // Focus on musical range
      .map((freq) => {
        const noteNum = frequencyToNoteNumber(freq);
        return noteNumberToName(noteNum);
      });

    // Remove duplicates (same note different octaves)
    const uniqueNoteNames = new Set(notes.map(getNoteWithoutOctave));

    return Array.from(uniqueNoteNames);
  }

  /**
   * Identify chord from detected notes
   */
  function identifyChord(notes: string[]): { name: string; quality: string } | null {
    if (notes.length < MIN_NOTES_FOR_CHORD) {
      return null;
    }

    // Try each note as the potential root
    for (let rootIdx = 0; rootIdx < notes.length; rootIdx++) {
      const root = notes[rootIdx];
      const rootNoteNum = noteNames.indexOf(root);

      if (rootNoteNum === -1) continue;

      // Calculate intervals from this root
      const intervals = notes
        .map((note) => {
          const noteNum = noteNames.indexOf(note);
          if (noteNum === -1) return -1;
          return semitoneDifference(rootNoteNum, noteNum);
        })
        .filter((interval) => interval !== -1)
        .sort((a, b) => a - b);

      // Create interval pattern
      const pattern = intervals.join('-');

      // Check if this pattern matches a known chord
      if (chordDatabase[pattern]) {
        const chordInfo = chordDatabase[pattern][0];
        return {
          name: `${root}${chordInfo.name}`,
          quality: chordInfo.quality,
        };
      }
    }

    return null;
  }

  /**
   * Apply smoothing to detected notes
   */
  function smoothNotes(notes: string[]): string[] {
    noteHistory.push(notes);
    if (noteHistory.length > HISTORY_SIZE) {
      noteHistory.shift();
    }

    // Count frequency of each note across history
    const noteCounts = new Map<string, number>();
    for (const historicalNotes of noteHistory) {
      for (const note of historicalNotes) {
        noteCounts.set(note, (noteCounts.get(note) || 0) + 1);
      }
    }

    // Keep notes that appear in at least 40% of recent samples
    const threshold = HISTORY_SIZE * 0.4;
    return Array.from(noteCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([note]) => note)
      .sort();
  }

  /**
   * Main detection loop
   */
  function detectChord() {
    if (!analyser || !isListening) return;

    analyser.getByteFrequencyData(frequencyData);

    const sampleRate = audioContext?.sampleRate || 44100;

    // Detect notes from spectrum
    let notes = detectNotes(frequencyData, sampleRate);

    // Apply smoothing
    notes = smoothNotes(notes);

    detectedNotes = notes;

    // Identify chord
    if (notes.length >= MIN_NOTES_FOR_CHORD) {
      const chord = identifyChord(notes);
      if (chord) {
        detectedChord = chord.name;
        chordQuality = chord.quality;
      } else {
        detectedChord = notes.join(' + ');
        chordQuality = 'Unidentified';
      }
    } else if (notes.length === 1) {
      detectedChord = notes[0];
      chordQuality = 'Single Note';
    } else {
      detectedChord = '--';
      chordQuality = '';
      noteHistory = [];
    }

    rafId = requestAnimationFrame(detectChord);
  }

  /**
   * Start listening to microphone
   */
  async function startChordFinder() {
    try {
      // Request microphone access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
        video: false,
      });

      // Create audio context and nodes
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(mediaStream);

      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.7; // Some smoothing for stability
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      // Initialize buffers
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      frequencyBuffer = new Float32Array(analyser.frequencyBinCount);

      // Connect the nodes
      microphone.connect(analyser);

      isListening = true;
      detectChord();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }

  /**
   * Stop listening to microphone
   */
  function stopChordFinder() {
    isListening = false;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (microphone) {
      microphone.disconnect();
      microphone = null;
    }

    if (analyser) {
      analyser.disconnect();
      analyser = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    detectedChord = '--';
    detectedNotes = [];
    chordQuality = '';
    noteHistory = [];
  }

  /**
   * Toggle chord finder on/off
   */
  function toggleChordFinder() {
    if (isListening) {
      stopChordFinder();
    } else {
      startChordFinder();
    }
  }

  // Cleanup on component destroy
  onDestroy(() => {
    stopChordFinder();
  });
</script>

<div class="chord-finder-container">
  <h1>Chord Finder</h1>
  <p class="subtitle">Discover what chord you're playing</p>

  <div class="chord-panel panel">
    <!-- Main Chord Display -->
    <div class="chord-display">
      <div class="chord-name" class:active={detectedChord !== '--'}>
        {detectedChord}
      </div>
      {#if chordQuality}
        <div class="chord-quality">{chordQuality}</div>
      {/if}
    </div>

    <!-- Detected Notes Display -->
    <div class="notes-display">
      <div class="notes-label">Detected Notes:</div>
      <div class="notes-grid">
        {#if detectedNotes.length > 0}
          {#each detectedNotes as note}
            <div class="note-badge">{note}</div>
          {/each}
        {:else}
          <div class="note-badge empty">---</div>
        {/if}
      </div>
    </div>

    <!-- Visual Spectrum Display -->
    <div class="spectrum-display">
      <div class="spectrum-bars">
        {#each Array(12) as _, i}
          <div
            class="spectrum-bar"
            class:active={detectedNotes.includes(noteNames[i])}
          >
            <div class="bar-fill"></div>
            <div class="bar-label">{noteNames[i]}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Control Button -->
    <button
      class="chord-button"
      class:active={isListening}
      onclick={toggleChordFinder}
    >
      {isListening ? '■ STOP' : '▶ START DETECTION'}
    </button>

    <!-- Instructions -->
    {#if !isListening}
      <div class="instructions">
        <p>Click START to begin chord detection</p>
        <p class="hint">Allow microphone access when prompted</p>
      </div>
    {:else}
      <div class="instructions active">
        <p>Play a chord on your instrument</p>
        <p class="hint">The chord will be identified in real-time</p>
      </div>
    {/if}

    <!-- Common Chords Reference -->
    <div class="chords-reference">
      <div class="reference-title">Common Chord Types</div>
      <div class="reference-grid">
        <div class="reference-row">
          <span class="chord-type">Major</span>
          <span class="chord-example">C, D, G</span>
        </div>
        <div class="reference-row">
          <span class="chord-type">Minor</span>
          <span class="chord-example">Cm, Dm, Em</span>
        </div>
        <div class="reference-row">
          <span class="chord-type">7th</span>
          <span class="chord-example">C7, G7, D7</span>
        </div>
        <div class="reference-row">
          <span class="chord-type">Major 7th</span>
          <span class="chord-example">Cmaj7, Gmaj7</span>
        </div>
        <div class="reference-row">
          <span class="chord-type">Suspended</span>
          <span class="chord-example">Csus2, Dsus4</span>
        </div>
        <div class="reference-row">
          <span class="chord-type">Diminished</span>
          <span class="chord-example">Cdim, Ddim</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .chord-finder-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    position: relative;
    z-index: 3;
  }

  .subtitle {
    color: var(--text-dim);
    margin-bottom: 2rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  .chord-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
    margin-top: 2rem;
  }

  /* Main Chord Display - HUGE and centered */
  .chord-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    min-height: 250px;
    justify-content: center;
    width: 100%;
  }

  .chord-name {
    font-size: 10rem;
    font-weight: bold;
    color: var(--text-dim);
    text-shadow: none;
    font-family: 'Courier New', monospace;
    line-height: 1;
    transition: all 0.3s ease;
    letter-spacing: 0.05em;
  }

  .chord-name.active {
    color: var(--neon-pink);
    text-shadow:
      0 0 40px var(--neon-pink),
      0 0 80px var(--neon-pink),
      0 0 120px var(--neon-pink);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      text-shadow:
        0 0 40px var(--neon-pink),
        0 0 80px var(--neon-pink),
        0 0 120px var(--neon-pink);
    }
    50% {
      text-shadow:
        0 0 50px var(--neon-pink),
        0 0 100px var(--neon-pink),
        0 0 150px var(--neon-pink);
    }
  }

  .chord-quality {
    font-size: 1.5rem;
    color: var(--neon-cyan);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    text-shadow:
      0 0 10px var(--neon-cyan),
      0 0 20px var(--neon-cyan);
  }

  /* Detected Notes Display */
  .notes-display {
    width: 100%;
    max-width: 700px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid var(--neon-purple);
    background: rgba(157, 78, 221, 0.05);
    box-shadow: 0 0 15px rgba(157, 78, 221, 0.3);
  }

  .notes-label {
    font-size: 1.2rem;
    color: var(--neon-purple);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    text-shadow: 0 0 10px var(--neon-purple);
  }

  .notes-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    align-items: center;
    min-height: 60px;
  }

  .note-badge {
    padding: 0.8rem 1.5rem;
    background: var(--bg-darker);
    border: 2px solid var(--neon-green);
    color: var(--neon-green);
    font-size: 1.3rem;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    letter-spacing: 0.1em;
    box-shadow:
      0 0 15px rgba(57, 255, 20, 0.4),
      inset 0 0 10px rgba(57, 255, 20, 0.1);
    text-shadow:
      0 0 10px var(--neon-green),
      0 0 20px var(--neon-green);
  }

  .note-badge.empty {
    border-color: var(--text-dim);
    color: var(--text-dim);
    box-shadow: none;
    text-shadow: none;
  }

  /* Spectrum Display */
  .spectrum-display {
    width: 100%;
    max-width: 800px;
    padding: 1.5rem;
    background: var(--bg-darker);
    border: 2px solid var(--neon-cyan);
    box-shadow:
      0 0 20px rgba(0, 245, 255, 0.3),
      inset 0 0 20px rgba(0, 245, 255, 0.05);
  }

  .spectrum-bars {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 0.5rem;
    height: 120px;
    align-items: end;
  }

  .spectrum-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    height: 100%;
    justify-content: flex-end;
  }

  .bar-fill {
    width: 100%;
    height: 20%;
    background: var(--bg-panel);
    border: 1px solid var(--text-dim);
    opacity: 0.3;
    transition: all 0.3s ease;
  }

  .spectrum-bar.active .bar-fill {
    height: 90%;
    background: var(--neon-cyan);
    border-color: var(--neon-cyan);
    opacity: 1;
    box-shadow:
      0 0 20px var(--neon-cyan),
      0 0 30px var(--neon-cyan);
    animation: bar-glow 1.5s ease-in-out infinite;
  }

  @keyframes bar-glow {
    0%,
    100% {
      box-shadow:
        0 0 20px var(--neon-cyan),
        0 0 30px var(--neon-cyan);
    }
    50% {
      box-shadow:
        0 0 30px var(--neon-cyan),
        0 0 50px var(--neon-cyan);
    }
  }

  .bar-label {
    font-size: 0.9rem;
    color: var(--text-dim);
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .spectrum-bar.active .bar-label {
    color: var(--neon-cyan);
    text-shadow:
      0 0 10px var(--neon-cyan),
      0 0 20px var(--neon-cyan);
  }

  /* Control Button */
  .chord-button {
    width: 100%;
    max-width: 450px;
    padding: 1.5rem 3rem;
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 1rem;
  }

  .chord-button.active {
    border-color: var(--neon-pink);
    color: var(--neon-pink);
    box-shadow:
      0 0 20px var(--neon-pink),
      0 0 30px var(--neon-pink),
      inset 0 0 20px rgba(255, 0, 110, 0.2);
  }

  .chord-button.active:hover {
    box-shadow:
      0 0 30px var(--neon-pink),
      0 0 50px var(--neon-pink),
      inset 0 0 30px rgba(255, 0, 110, 0.3);
  }

  /* Instructions */
  .instructions {
    text-align: center;
    color: var(--text-dim);
    padding: 1.5rem;
    border: 1px solid var(--neon-purple);
    background: rgba(157, 78, 221, 0.05);
    box-shadow: 0 0 10px rgba(157, 78, 221, 0.2);
    max-width: 600px;
    width: 100%;
  }

  .instructions p {
    margin: 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .instructions p:first-child {
    font-size: 1.1rem;
    color: var(--neon-purple);
    text-shadow: 0 0 10px var(--neon-purple);
  }

  .instructions.active {
    border-color: var(--neon-cyan);
    background: rgba(0, 245, 255, 0.05);
    box-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
  }

  .instructions.active p:first-child {
    color: var(--neon-cyan);
    text-shadow: 0 0 10px var(--neon-cyan);
  }

  .hint {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  /* Chords Reference */
  .chords-reference {
    width: 100%;
    max-width: 700px;
    padding: 1.5rem;
    border: 1px solid var(--neon-green);
    background: rgba(57, 255, 20, 0.03);
    box-shadow: 0 0 15px rgba(57, 255, 20, 0.2);
  }

  .reference-title {
    font-size: 1rem;
    color: var(--neon-green);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 1rem;
    text-shadow: 0 0 10px var(--neon-green);
  }

  .reference-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 0.8rem;
  }

  .reference-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 1rem;
    background: rgba(57, 255, 20, 0.05);
    border: 1px solid rgba(57, 255, 20, 0.2);
  }

  .chord-type {
    color: var(--neon-green);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.9rem;
  }

  .chord-example {
    color: var(--text-dim);
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
    font-size: 0.9rem;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .chord-name {
      font-size: 7rem;
    }
  }

  @media (max-width: 768px) {
    .chord-finder-container {
      padding: 1rem;
    }

    .chord-name {
      font-size: 5rem;
    }

    .chord-quality {
      font-size: 1.2rem;
    }

    .spectrum-bars {
      gap: 0.3rem;
      height: 100px;
    }

    .bar-label {
      font-size: 0.75rem;
    }

    .note-badge {
      padding: 0.6rem 1rem;
      font-size: 1.1rem;
    }

    .chord-button {
      font-size: 1.2rem;
      padding: 1.2rem 2rem;
    }

    .reference-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .chord-name {
      font-size: 3.5rem;
    }

    .spectrum-bars {
      gap: 0.2rem;
    }
  }
</style>
