<script lang="ts">
  import type { ThemeAssets } from './generated/manifest';
  import type { ThemeUrls } from './preload';
  import MediaSlot from './MediaSlot.svelte';

  export let spec: ThemeAssets;
  export let urls: ThemeUrls;
  export let active: boolean;

  $: background = spec.background;
  $: foreground = spec.foreground;
  $: backgroundKind = background && background.kind !== 'audio' ? background.kind : null;
  $: foregroundKind = foreground && foreground.kind !== 'audio' ? foreground.kind : null;
</script>

<div class="theme" style="opacity: {active ? 1 : 0}">
  {#if backgroundKind && urls.background}
    <MediaSlot src={urls.background} kind={backgroundKind} mode="cover" {active} />
  {/if}
  {#if foregroundKind && urls.foreground}
    <MediaSlot src={urls.foreground} kind={foregroundKind} mode="contain" {active} />
  {/if}
</div>

<style>
  .theme {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }
</style>
