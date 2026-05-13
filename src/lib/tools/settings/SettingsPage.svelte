<script lang="ts">
	import SettingsRow from '$lib/ui/SettingsRow.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
</script>

<ToolCanvas>
	<TopBar title="Settings" />

	<section aria-labelledby="audio-settings">
		<div class="eyebrow section-label" id="audio-settings">Audio</div>
		<div class="settings-group">
			<SettingsRow
				icon="mic"
				tone="coral"
				title="Microphone"
				subtitle="Used by tuner & scales"
				switchOn
			/>
			<SettingsRow
				icon="metronome"
				tone="sun"
				title="Click sound"
				subtitle="Wood · Beep · Cowbell"
				value="Wood"
			/>
		</div>
	</section>

	<section aria-labelledby="instrument-settings">
		<div class="eyebrow section-label" id="instrument-settings">Instrument</div>
		<div class="settings-group">
			<SettingsRow title="Instrument" subtitle="v1 is guitar-only" value="Guitar" />
			<SettingsRow title="Tuning" subtitle="E A D G B E · standard" value="Standard" />
		</div>
	</section>

	<section aria-labelledby="about-settings">
		<div class="eyebrow section-label" id="about-settings">About</div>
		<div class="settings-group">
			<SettingsRow icon="check" title="Local-only" subtitle="Nothing leaves this device" success />
			<SettingsRow
				icon="check"
				title="Offline ready · v0.3"
				subtitle="Chord library installed"
				success
			/>
		</div>
	</section>
</ToolCanvas>

<style>
	.section-label {
		margin-bottom: 8px;
	}

	.settings-group {
		background: var(--paper-soft);
		border-radius: var(--r-md);
		padding: 4px 20px;
	}
</style>
