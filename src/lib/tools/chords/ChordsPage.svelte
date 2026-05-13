<script lang="ts">
	import { getRequiredToolByRoute } from '$lib/app';
	import DeferredToolPlaceholder from '$lib/ui/DeferredToolPlaceholder.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';

	const tool = getRequiredToolByRoute('/chords');
</script>

<ToolCanvas>
	<TopBar title={tool.name} />
	<DeferredToolPlaceholder {tool} />
</ToolCanvas>
