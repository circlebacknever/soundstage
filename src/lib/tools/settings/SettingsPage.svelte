<script lang="ts">
	import { WORDS } from '$lib/content';
	import SettingsRow from '$lib/ui/SettingsRow.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
</script>

<ToolCanvas>
	<TopBar title={WORDS.settings.title} />

	<section aria-labelledby="audio-settings">
		<div class="eyebrow section-label" id="audio-settings">{WORDS.settings.sections.audio}</div>
		<div class="settings-group">
			<SettingsRow
				icon="mic"
				tone="coral"
				title={WORDS.settings.rows.microphone.title}
				subtitle={WORDS.settings.rows.microphone.subtitle}
				switchOn
			/>
			<SettingsRow
				icon="metronome"
				tone="sun"
				title={WORDS.settings.rows.clickSound.title}
				subtitle={WORDS.settings.rows.clickSound.subtitle}
				value={WORDS.settings.rows.clickSound.value}
			/>
		</div>
	</section>

	<section aria-labelledby="instrument-settings">
		<div class="eyebrow section-label" id="instrument-settings">
			{WORDS.settings.sections.instrument}
		</div>
		<div class="settings-group">
			<SettingsRow
				title={WORDS.settings.rows.instrument.title}
				subtitle={WORDS.settings.rows.instrument.subtitle}
				value={WORDS.settings.rows.instrument.value}
			/>
			<SettingsRow
				title={WORDS.settings.rows.tuning.title}
				subtitle={WORDS.settings.rows.tuning.subtitle}
				value={WORDS.settings.rows.tuning.value}
			/>
		</div>
	</section>

	<section aria-labelledby="about-settings">
		<div class="eyebrow section-label" id="about-settings">{WORDS.settings.sections.about}</div>
		<div class="settings-group">
			<SettingsRow
				icon="check"
				title={WORDS.settings.rows.localOnly.title}
				subtitle={WORDS.settings.rows.localOnly.subtitle}
				success
			/>
			<SettingsRow
				icon="check"
				title={WORDS.settings.rows.offlineReady.title}
				subtitle={WORDS.settings.rows.offlineReady.subtitle}
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
