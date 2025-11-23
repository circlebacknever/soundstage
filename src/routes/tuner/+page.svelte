<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Audio context and nodes
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let microphone: MediaStreamAudioSourceNode | null = null;
  let mediaStream: MediaStream | null = null;

  // Tuner state
  let isListening = $state(false);
  let currentNote = $state('--');
  let currentFrequency = $state(0);
  let cents = $state(0); // Deviation from perfect pitch (-50 to +50 cents)
  let rafId: number | null = null;

  // Pitch detection config
  const MIN_SAMPLES = 0; // Minimum autocorrelation samples
  const GOOD_ENOUGH_CORRELATION = 0.9; // Threshold for accepting pitch
  const bufferSize = 4096;
  let buffer = new Float32Array(bufferSize);

  // Note names
  const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Smoothing filter to avoid jitter
  let frequencyHistory: number[] = [];
  const historySize = 5; // Number of samples to average

  /**
   * Convert frequency to musical note
   */
  function frequencyToNote(frequency: number): { note: string; cents: number } {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const noteIndex = Math.round(noteNum) + 69;
    const noteName = noteStrings[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);

    return {
      note: `${noteName}${octave}`,
      cents: cents
    };
  }

  /**
   * Autocorrelation-based pitch detection
   * This is a robust algorithm that works well for musical instruments
   */
  function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    // Find the size of the buffer
    let size = buffer.length;
    let maxSamples = Math.floor(size / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    // Calculate RMS (root mean square) to check if there's enough signal
    for (let i = 0; i < size; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);

    // Not enough signal
    if (rms < 0.01) return -1;

    // Find the first zero crossing
    let lastCorrelation = 1;
    for (let offset = MIN_SAMPLES; offset < maxSamples; offset++) {
      let correlation = 0;

      for (let i = 0; i < maxSamples; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }

      correlation = 1 - correlation / maxSamples;

      if (correlation > GOOD_ENOUGH_CORRELATION && correlation > lastCorrelation) {
        const foundGoodCorrelation = true;
        if (foundGoodCorrelation) {
          // Use parabolic interpolation for better accuracy
          const shift =
            (correlation - lastCorrelation) /
            (2 * correlation - lastCorrelation - bestCorrelation);
          return sampleRate / (offset + shift);
        }
      }

      lastCorrelation = correlation;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestCorrelation > 0.01) {
      return sampleRate / bestOffset;
    }
    return -1;
  }

  /**
   * Apply smoothing filter to frequency
   */
  function smoothFrequency(frequency: number): number {
    if (frequency === -1) {
      frequencyHistory = [];
      return -1;
    }

    frequencyHistory.push(frequency);
    if (frequencyHistory.length > historySize) {
      frequencyHistory.shift();
    }

    // Calculate median instead of average for better noise rejection
    const sorted = [...frequencyHistory].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Main pitch detection loop
   */
  function detectPitch() {
    if (!analyser || !isListening) return;

    analyser.getFloatTimeDomainData(buffer);

    const sampleRate = audioContext?.sampleRate || 44100;
    let frequency = autoCorrelate(buffer, sampleRate);

    // Apply smoothing filter
    frequency = smoothFrequency(frequency);

    if (frequency !== -1 && frequency > 30 && frequency < 4200) {
      const noteInfo = frequencyToNote(frequency);
      currentNote = noteInfo.note;
      currentFrequency = Math.round(frequency * 10) / 10;
      cents = noteInfo.cents;
    } else {
      // Fade out when no signal
      currentNote = '--';
      currentFrequency = 0;
      cents = 0;
    }

    rafId = requestAnimationFrame(detectPitch);
  }

  /**
   * Start listening to microphone
   */
  async function startTuner() {
    try {
      // Request microphone access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        },
        video: false
      });

      // Create audio context and nodes
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(mediaStream);

      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;

      // Connect the nodes
      microphone.connect(analyser);

      isListening = true;
      detectPitch();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }

  /**
   * Stop listening to microphone
   */
  function stopTuner() {
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

    currentNote = '--';
    currentFrequency = 0;
    cents = 0;
    frequencyHistory = [];
  }

  /**
   * Toggle tuner on/off
   */
  function toggleTuner() {
    if (isListening) {
      stopTuner();
    } else {
      startTuner();
    }
  }

  // Cleanup on component destroy
  onDestroy(() => {
    stopTuner();
  });
</script>

<div class="tuner-container">
  <h1>Instrument Tuner</h1>
  <p class="subtitle">Tune your instrument with precision</p>

  <div class="tuner-panel panel">
    <!-- Tuning Indicator -->
    <div class="tuning-indicator">
      <div class="indicator-track">
        <div class="indicator-marks">
          {#each Array(11) as _, i}
            <div
              class="mark"
              class:center={i === 5}
              class:major={i === 0 || i === 10 || i === 5}
            ></div>
          {/each}
        </div>
        <div
          class="indicator-needle"
          style="left: {50 + cents}%"
          class:in-tune={Math.abs(cents) < 5}
          class:sharp={cents > 5}
          class:flat={cents < -5}
        ></div>
      </div>
      <div class="indicator-labels">
        <span class="flat-label">♭ FLAT</span>
        <span class="tune-label">IN TUNE</span>
        <span class="sharp-label">SHARP ♯</span>
      </div>
    </div>

    <!-- Note Display -->
    <div class="note-display">
      <div class="frequency-badge">{currentFrequency > 0 ? `${currentFrequency} Hz` : '---'}</div>
      <div class="note-value" class:active={currentNote !== '--'}>{currentNote}</div>
      <div class="cents-display" class:visible={currentNote !== '--'}>
        {cents > 0 ? '+' : ''}{cents} cents
      </div>
    </div>

    <!-- Control Button -->
    <button class="tuner-button" class:active={isListening} onclick={toggleTuner}>
      {isListening ? '■ STOP' : '▶ START TUNER'}
    </button>

    <!-- Instructions -->
    {#if !isListening}
      <div class="instructions">
        <p>Click START to begin tuning</p>
        <p class="hint">Allow microphone access when prompted</p>
      </div>
    {:else}
      <div class="instructions active">
        <p>Play a note on your instrument</p>
        <p class="hint">Adjust until the needle is centered</p>
      </div>
    {/if}

    <!-- Common Tunings Reference -->
    <div class="tuning-reference">
      <div class="reference-title">Standard Tuning Reference</div>
      <div class="reference-grid">
        <div class="reference-item">
          <span class="string-label">Guitar:</span>
          <span class="notes">E2 A2 D3 G3 B3 E4</span>
        </div>
        <div class="reference-item">
          <span class="string-label">Bass:</span>
          <span class="notes">E1 A1 D2 G2</span>
        </div>
        <div class="reference-item">
          <span class="string-label">Ukulele:</span>
          <span class="notes">G4 C4 E4 A4</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .tuner-container {
    max-width: 900px;
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

  .tuner-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
    margin-top: 2rem;
  }

  /* Tuning Indicator */
  .tuning-indicator {
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .indicator-track {
    position: relative;
    height: 80px;
    background: var(--bg-darker);
    border: 2px solid var(--neon-purple);
    box-shadow:
      0 0 15px rgba(157, 78, 221, 0.3),
      inset 0 0 20px rgba(157, 78, 221, 0.1);
    overflow: visible;
  }

  .indicator-marks {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem;
  }

  .mark {
    width: 2px;
    height: 30%;
    background: var(--text-dim);
    opacity: 0.5;
  }

  .mark.major {
    height: 60%;
    background: var(--neon-purple);
    opacity: 0.8;
  }

  .mark.center {
    height: 80%;
    width: 3px;
    background: var(--neon-green);
    opacity: 1;
    box-shadow: 0 0 10px var(--neon-green);
  }

  .indicator-needle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 100%;
    background: var(--neon-cyan);
    box-shadow:
      0 0 20px var(--neon-cyan),
      0 0 40px var(--neon-cyan);
    transition: left 0.15s ease-out;
    pointer-events: none;
  }

  .indicator-needle::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 12px solid var(--neon-cyan);
    filter: drop-shadow(0 0 8px var(--neon-cyan));
  }

  .indicator-needle.in-tune {
    background: var(--neon-green);
    box-shadow:
      0 0 25px var(--neon-green),
      0 0 50px var(--neon-green);
  }

  .indicator-needle.in-tune::before {
    border-top-color: var(--neon-green);
    filter: drop-shadow(0 0 10px var(--neon-green));
  }

  .indicator-needle.sharp {
    background: var(--neon-pink);
    box-shadow:
      0 0 20px var(--neon-pink),
      0 0 40px var(--neon-pink);
  }

  .indicator-needle.sharp::before {
    border-top-color: var(--neon-pink);
    filter: drop-shadow(0 0 8px var(--neon-pink));
  }

  .indicator-needle.flat {
    background: var(--neon-orange);
    box-shadow:
      0 0 20px var(--neon-orange),
      0 0 40px var(--neon-orange);
  }

  .indicator-needle.flat::before {
    border-top-color: var(--neon-orange);
    filter: drop-shadow(0 0 8px var(--neon-orange));
  }

  .indicator-labels {
    display: flex;
    justify-content: space-between;
    color: var(--text-dim);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .flat-label {
    color: var(--neon-orange);
    text-shadow: 0 0 5px var(--neon-orange);
  }

  .tune-label {
    color: var(--neon-green);
    text-shadow: 0 0 5px var(--neon-green);
  }

  .sharp-label {
    color: var(--neon-pink);
    text-shadow: 0 0 5px var(--neon-pink);
  }

  /* Note Display */
  .note-display {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    min-height: 200px;
    justify-content: center;
  }

  .frequency-badge {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 1.2rem;
    color: var(--neon-purple);
    text-shadow:
      0 0 10px var(--neon-purple),
      0 0 20px var(--neon-purple);
    padding: 0.5rem 1rem;
    border: 1px solid var(--neon-purple);
    background: rgba(157, 78, 221, 0.1);
    box-shadow: 0 0 15px rgba(157, 78, 221, 0.3);
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
  }

  .note-value {
    font-size: 8rem;
    font-weight: bold;
    color: var(--text-dim);
    text-shadow: none;
    font-family: 'Courier New', monospace;
    line-height: 1;
    transition: all 0.3s ease;
    min-width: 300px;
  }

  .note-value.active {
    color: var(--neon-cyan);
    text-shadow:
      0 0 30px var(--neon-cyan),
      0 0 60px var(--neon-cyan),
      0 0 90px var(--neon-cyan);
  }

  .cents-display {
    font-size: 1.5rem;
    color: var(--text-dim);
    font-family: 'Courier New', monospace;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .cents-display.visible {
    opacity: 1;
    color: var(--neon-yellow);
    text-shadow:
      0 0 10px var(--neon-yellow),
      0 0 20px var(--neon-yellow);
  }

  /* Control Button */
  .tuner-button {
    width: 100%;
    max-width: 400px;
    padding: 1.5rem 3rem;
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 1rem;
  }

  .tuner-button.active {
    border-color: var(--neon-pink);
    color: var(--neon-pink);
    box-shadow:
      0 0 20px var(--neon-pink),
      0 0 30px var(--neon-pink),
      inset 0 0 20px rgba(255, 0, 110, 0.2);
  }

  .tuner-button.active:hover {
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
    max-width: 500px;
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

  /* Tuning Reference */
  .tuning-reference {
    width: 100%;
    max-width: 600px;
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
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .reference-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: rgba(57, 255, 20, 0.05);
    border: 1px solid rgba(57, 255, 20, 0.2);
  }

  .string-label {
    color: var(--neon-green);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .notes {
    color: var(--text-dim);
    font-family: 'Courier New', monospace;
    letter-spacing: 0.15em;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .tuner-container {
      padding: 1rem;
    }

    .note-value {
      font-size: 5rem;
      min-width: 200px;
    }

    .frequency-badge {
      font-size: 1rem;
      padding: 0.3rem 0.8rem;
    }

    .tuning-indicator {
      max-width: 100%;
    }

    .indicator-track {
      height: 60px;
    }

    .tuner-button {
      font-size: 1.2rem;
      padding: 1.2rem 2rem;
    }

    .reference-item {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
  }
</style>
