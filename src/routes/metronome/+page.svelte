<script lang="ts">
  import { onDestroy } from 'svelte';

  // Metronome state
  let bpm = $state(120);
  let isPlaying = $state(false);
  let currentBeat = $state(0);
  let intervalId: number | null = null;
  let audioContext: AudioContext | null = null;
  let nextNoteTime = 0.0;
  let scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
  let lookahead = 25.0; // How frequently to call scheduling function (ms)
  let timerID: number | null = null;

  // Visual feedback state
  let isBeating = $state(false);

  // Initialize Audio Context
  function initAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    nextNoteTime = audioContext.currentTime;
  }

  // Create click sound
  function scheduleNote(time: number) {
    if (!audioContext) return;

    // Create oscillator for click sound
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    osc.frequency.value = 1000; // Frequency of the click
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(envelope);
    envelope.connect(audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.03);

    // Trigger visual feedback
    if (audioContext.currentTime >= time - 0.02) {
      triggerBeat();
    }
  }

  // Scheduler function
  function scheduler() {
    if (!audioContext) return;

    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
      scheduleNote(nextNoteTime);
      nextNoteTime += 60.0 / bpm;
      currentBeat = (currentBeat + 1) % 4;
    }

    timerID = window.setTimeout(scheduler, lookahead);
  }

  // Visual beat feedback
  function triggerBeat() {
    isBeating = true;
    setTimeout(() => {
      isBeating = false;
    }, 100);
  }

  // Toggle play/stop
  function togglePlay() {
    if (!isPlaying) {
      // Start playing
      initAudioContext();
      isPlaying = true;
      currentBeat = 0;
      scheduler();
    } else {
      // Stop playing
      isPlaying = false;
      if (timerID) {
        clearTimeout(timerID);
        timerID = null;
      }
      currentBeat = 0;
    }
  }

  // Update BPM from slider
  function updateBPM(event: Event) {
    const target = event.target as HTMLInputElement;
    bpm = parseInt(target.value);
  }

  // Update BPM from input
  function updateBPMInput(event: Event) {
    const target = event.target as HTMLInputElement;
    let value = parseInt(target.value);
    if (value < 30) value = 30;
    if (value > 300) value = 300;
    bpm = value;
  }

  // Increment/Decrement BPM
  function incrementBPM() {
    if (bpm < 300) bpm++;
  }

  function decrementBPM() {
    if (bpm > 30) bpm--;
  }

  // Cleanup on component destroy
  onDestroy(() => {
    if (timerID) {
      clearTimeout(timerID);
    }
    if (audioContext) {
      audioContext.close();
    }
  });
</script>

<div class="page-container">
  <a href="/" class="home-link">← Home</a>
  <h1>Metronome</h1>
  <p class="page-subtitle">Keep time with precision</p>

  <div class="tool-panel panel">
    <!-- Visual Beat Indicator -->
    <div class="beat-indicator" class:beating={isBeating}>
      <div class="beat-ring"></div>
      <div class="beat-core"></div>
    </div>

    <!-- BPM Display -->
    <div class="bpm-display">
      <div class="bpm-value">{bpm}</div>
      <div class="bpm-label">BPM</div>
    </div>

    <!-- BPM Controls -->
    <div class="bpm-controls">
      <button class="bpm-btn" onclick={decrementBPM} disabled={isPlaying}>-</button>
      <div class="slider-container">
        <input
          type="range"
          min="30"
          max="300"
          value={bpm}
          oninput={updateBPM}
          disabled={isPlaying}
          class="bpm-slider"
        />
        <div class="slider-labels">
          <span>30</span>
          <span>165</span>
          <span>300</span>
        </div>
      </div>
      <button class="bpm-btn" onclick={incrementBPM} disabled={isPlaying}>+</button>
    </div>

    <!-- Direct BPM Input -->
    <div class="bpm-input-container">
      <label for="bpm-input">Set BPM:</label>
      <input
        id="bpm-input"
        type="number"
        min="30"
        max="300"
        value={bpm}
        oninput={updateBPMInput}
        disabled={isPlaying}
      />
    </div>

    <!-- Play/Stop Button -->
    <button class="play-button" class:playing={isPlaying} onclick={togglePlay}>
      {isPlaying ? '■ STOP' : '▶ START'}
    </button>

    <!-- Tempo Reference -->
    <div class="info-box green tempo-reference">
      <div class="tempo-label">
        {#if bpm < 60}
          Largo
        {:else if bpm < 76}
          Adagio
        {:else if bpm < 108}
          Andante
        {:else if bpm < 120}
          Moderato
        {:else if bpm < 156}
          Allegro
        {:else if bpm < 176}
          Vivace
        {:else}
          Presto
        {/if}
      </div>
    </div>
  </div>
</div>

<style>

  /* Beat Indicator */
  .beat-indicator {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.1s ease;
  }

  .beat-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 3px solid var(--neon-purple);
    border-radius: 50%;
    box-shadow:
      0 0 20px rgba(157, 78, 221, 0.3),
      inset 0 0 20px rgba(157, 78, 221, 0.1);
    transition: all 0.1s ease;
  }

  .beat-core {
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, var(--neon-cyan) 0%, transparent 70%);
    border-radius: 50%;
    opacity: 0.3;
    transition: all 0.1s ease;
  }

  .beat-indicator.beating .beat-ring {
    border-color: var(--neon-cyan);
    box-shadow:
      0 0 40px var(--neon-cyan),
      0 0 60px var(--neon-cyan),
      inset 0 0 30px rgba(0, 245, 255, 0.3);
    transform: scale(1.05);
  }

  .beat-indicator.beating .beat-core {
    opacity: 1;
    background: radial-gradient(circle, var(--neon-cyan) 0%, var(--neon-purple) 70%);
    box-shadow:
      0 0 40px var(--neon-cyan),
      0 0 60px var(--neon-cyan);
    transform: scale(1.1);
  }

  /* BPM Display */
  .bpm-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .bpm-value {
    font-size: 4rem;
    font-weight: bold;
    color: var(--neon-cyan);
    text-shadow:
      0 0 20px var(--neon-cyan),
      0 0 40px var(--neon-cyan);
    font-family: 'Courier New', monospace;
    min-width: 200px;
  }

  .bpm-label {
    font-size: 1.2rem;
    color: var(--neon-purple);
    text-transform: uppercase;
    letter-spacing: 0.3em;
  }

  /* BPM Controls */
  .bpm-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    max-width: 600px;
  }

  .bpm-btn {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
    padding: 0;
    flex-shrink: 0;
  }

  .slider-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .bpm-slider {
    width: 100%;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    color: var(--text-dim);
    font-size: 0.8rem;
    padding: 0 0.5rem;
  }

  /* BPM Input */
  .bpm-input-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .bpm-input-container label {
    color: var(--neon-purple);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.9rem;
  }

  .bpm-input-container input {
    width: 100px;
    text-align: center;
  }

  /* Play Button */
  .play-button {
    width: 100%;
    max-width: 300px;
    padding: 1.5rem 3rem;
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 1rem;
  }

  .play-button.playing {
    border-color: var(--neon-pink);
    color: var(--neon-pink);
    box-shadow:
      0 0 20px var(--neon-pink),
      0 0 30px var(--neon-pink),
      inset 0 0 20px rgba(255, 0, 110, 0.2);
  }

  .play-button.playing:hover {
    box-shadow:
      0 0 30px var(--neon-pink),
      0 0 50px var(--neon-pink),
      inset 0 0 30px rgba(255, 0, 110, 0.3);
  }

  /* Tempo Reference */
  .tempo-reference {
    max-width: 500px;
  }

  .tempo-label {
    font-size: 1.2rem;
    color: var(--neon-green);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    text-shadow:
      0 0 10px var(--neon-green),
      0 0 20px var(--neon-green);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .page-container {
      padding: 1rem;
    }

    .beat-indicator {
      width: 150px;
      height: 150px;
    }

    .beat-core {
      width: 90px;
      height: 90px;
    }

    .bpm-value {
      font-size: 3rem;
    }

    .bpm-controls {
      flex-direction: column;
      gap: 1rem;
    }

    .slider-container {
      width: 100%;
    }
  }
</style>
