<script lang="ts">
</script>

<div class="container">
	<header>
		<h1 class="title">soundstage</h1>
		<p class="subtitle">Your retro audio toolkit</p>
	</header>

	<div class="cards">
		<a href="/tuner" class="card">
			<div class="card-icon tuner-icon">♪</div>
			<h2>Tuner</h2>
			<p>Real-time pitch detection for precise instrument tuning</p>
		</a>

		<a href="/metronome" class="card">
			<div class="card-icon metronome-icon">⌚</div>
			<h2>Metronome</h2>
			<p>Keep perfect time with visual and audio beats</p>
		</a>

		<a href="/chord-finder" class="card">
			<div class="card-icon chord-icon">♫</div>
			<h2>Chord Finder</h2>
			<p>Identify chords from multiple simultaneous notes</p>
		</a>
	</div>
</div>

<style>
	.container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 3rem;
	}

	header {
		text-align: center;
	}

	.title {
		font-size: 6rem;
		font-weight: bold;
		margin: 0;
		background: linear-gradient(
			135deg,
			var(--neon-pink),
			var(--neon-cyan),
			var(--neon-purple),
			var(--neon-green)
		);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: 0 0 30px rgba(255, 0, 110, 0.5),
		             0 0 60px rgba(0, 245, 255, 0.3);
		letter-spacing: 0.1em;
		animation: glow-pulse 3s ease-in-out infinite;
	}

	@keyframes glow-pulse {
		0%, 100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.3);
		}
	}

	.subtitle {
		font-size: 1.2rem;
		color: var(--text-dim);
		margin-top: 1rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		max-width: 1200px;
		width: 100%;
	}

	.card {
		background: var(--bg-panel);
		border: 2px solid var(--neon-purple);
		padding: 2.5rem 2rem;
		text-decoration: none;
		color: var(--text-bright);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		transition: all 0.3s ease;
		box-shadow: 0 0 20px rgba(157, 78, 221, 0.3);
		position: relative;
		overflow: hidden;
	}

	.card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.1),
			transparent
		);
		transition: left 0.5s ease;
	}

	.card:hover::before {
		left: 100%;
	}

	.card:hover {
		border-color: var(--neon-cyan);
		box-shadow: 0 0 40px rgba(0, 245, 255, 0.6),
		            0 0 20px rgba(157, 78, 221, 0.3);
		transform: translateY(-8px);
	}

	.card-icon {
		font-size: 4rem;
		width: 100px;
		height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.tuner-icon {
		background: rgba(255, 0, 110, 0.1);
		border: 2px solid var(--neon-pink);
		color: var(--neon-pink);
		text-shadow: 0 0 20px var(--neon-pink);
	}

	.card:hover .tuner-icon {
		box-shadow: 0 0 30px rgba(255, 0, 110, 0.6);
		transform: rotate(15deg) scale(1.1);
	}

	.metronome-icon {
		background: rgba(57, 255, 20, 0.1);
		border: 2px solid var(--neon-green);
		color: var(--neon-green);
		text-shadow: 0 0 20px var(--neon-green);
	}

	.card:hover .metronome-icon {
		box-shadow: 0 0 30px rgba(57, 255, 20, 0.6);
		transform: rotate(-15deg) scale(1.1);
	}

	.chord-icon {
		background: rgba(0, 245, 255, 0.1);
		border: 2px solid var(--neon-cyan);
		color: var(--neon-cyan);
		text-shadow: 0 0 20px var(--neon-cyan);
	}

	.card:hover .chord-icon {
		box-shadow: 0 0 30px rgba(0, 245, 255, 0.6);
		transform: scale(1.1);
	}

	.card h2 {
		font-size: 1.8rem;
		margin: 0;
		letter-spacing: 0.05em;
	}

	.card p {
		font-size: 1rem;
		text-align: center;
		color: var(--text-dim);
		margin: 0;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.title {
			font-size: 3.5rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.cards {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.container {
			gap: 2rem;
			padding: 1rem;
		}
	}

	@media (max-width: 480px) {
		.title {
			font-size: 2.5rem;
		}

		.card {
			padding: 2rem 1.5rem;
		}

		.card-icon {
			font-size: 3rem;
			width: 80px;
			height: 80px;
		}
	}
</style>
