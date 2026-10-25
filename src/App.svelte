<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { MANIFEST, THEME_IDS, type ThemeId } from './generated/manifest';
  import { getVirtualDate } from './clock';
  import { themeFor } from './theme';
  import { preloadTheme, type ThemeUrls } from './preload';
  import { attachMusic, setMusicTheme, unlockMusic } from './music';
  import ThemePane from './ThemePane.svelte';
  import Timer from './Timer.svelte';

  const emptyUrls: ThemeUrls = { background: null, foreground: null, music: null };

  let now = getVirtualDate();
  let theme: ThemeId = themeFor(now);
  let shown: ThemeId = theme;
  let ready: Record<ThemeId, boolean> = {
    halloween: false,
    christmas: false,
    default: false,
  };
  let urls: Record<ThemeId, ThemeUrls> = {
    halloween: emptyUrls,
    christmas: emptyUrls,
    default: emptyUrls,
  };

  let raf = 0;
  let lastMusic: ThemeId | null = null;

  function refresh(): void {
    now = getVirtualDate();
    theme = themeFor(now);
    if (ready[theme]) {
      shown = theme;
    }
  }

  function tick(): void {
    refresh();
    raf = requestAnimationFrame(tick);
  }

  $: if (ready[shown] && lastMusic !== shown) {
    lastMusic = shown;
    setMusicTheme(shown);
  }

  onMount(() => {
    raf = requestAnimationFrame(tick);
    for (let i = 0; i < THEME_IDS.length; i += 1) {
      const id = THEME_IDS[i];
      preloadTheme(MANIFEST[id]).then((loaded) => {
        urls[id] = loaded;
        urls = urls;
        if (loaded.music) {
          attachMusic(id, loaded.music);
        }
        ready[id] = true;
        ready = ready;
        refresh();
      });
    }
  });

  onDestroy(() => {
    if (raf) {
      cancelAnimationFrame(raf);
    }
  });
</script>

<div class="stage" on:pointerdown={unlockMusic} on:click={unlockMusic} on:keydown={unlockMusic}>
  {#each THEME_IDS as id}
    <ThemePane spec={MANIFEST[id]} urls={urls[id]} active={ready[id] && shown === id} />
  {/each}
  <Timer date={now} onChange={refresh} />
</div>

<style>
  :global(html),
  :global(body) {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
    -ms-touch-action: none;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  .stage {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
    pointer-events: auto;
  }
</style>
