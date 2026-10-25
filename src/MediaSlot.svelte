<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { containRect, coverRect, mimeFromPath, silenceVideo, type Rect } from './media';

  export let src: string;
  export let kind: 'image' | 'video';
  export let mode: 'cover' | 'contain';
  export let active: boolean;

  let node: HTMLImageElement | HTMLVideoElement | null = null;
  let frame: HTMLDivElement;
  let rect: Rect = { left: 0, top: 0, width: 0, height: 0 };
  let lastActive: boolean | null = null;
  let lastSrc = '';

  $: mime = mimeFromPath(src, kind);

  function mediaSize(): { w: number; h: number } {
    if (!node) {
      return { w: 0, h: 0 };
    }
    if (kind === 'video') {
      const video = node as HTMLVideoElement;
      return { w: video.videoWidth, h: video.videoHeight };
    }
    const image = node as HTMLImageElement;
    return { w: image.naturalWidth, h: image.naturalHeight };
  }

  function layout(): void {
    if (!frame) {
      return;
    }
    const viewW = frame.clientWidth;
    const viewH = frame.clientHeight;
    const size = mediaSize();
    rect = mode === 'cover' ? coverRect(size.w, size.h, viewW, viewH) : containRect(size.w, size.h, viewW, viewH);
  }

  function playVideo(): void {
    if (!node || kind !== 'video') {
      return;
    }
    const video = node as HTMLVideoElement;
    silenceVideo(video);
    const play = video.play();
    if (play && play.catch) {
      play.catch(() => {});
    }
  }

  function pauseVideo(reset: boolean): void {
    if (!node || kind !== 'video') {
      return;
    }
    const video = node as HTMLVideoElement;
    silenceVideo(video);
    video.pause();
    if (reset) {
      try {
        video.currentTime = 0;
      } catch (err) {
        void err;
      }
    }
  }

  function onReady(): void {
    if (kind === 'video' && node) {
      const video = node as HTMLVideoElement;
      silenceVideo(video);
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      try {
        video.disablePictureInPicture = true;
      } catch (err) {
        void err;
      }
    }
    layout();
    if (active) {
      playVideo();
    }
  }

  function onEnded(): void {
    if (!node || kind !== 'video') {
      return;
    }
    const video = node as HTMLVideoElement;
    silenceVideo(video);
    try {
      video.currentTime = 0;
    } catch (err) {
      void err;
    }
    if (active) {
      playVideo();
    }
  }

  function onVolumeChange(): void {
    if (!node || kind !== 'video') {
      return;
    }
    silenceVideo(node as HTMLVideoElement);
  }

  function onError(): void {
    if (!node || kind !== 'video') {
      return;
    }
    const video = node as HTMLVideoElement;
    try {
      video.load();
    } catch (err) {
      void err;
    }
    if (active) {
      playVideo();
    }
  }

  function syncPlayback(isActive: boolean): void {
    if (lastActive === isActive) {
      return;
    }
    lastActive = isActive;
    if (isActive) {
      playVideo();
    } else {
      pauseVideo(true);
    }
  }

  $: if (node && kind === 'video' && src && src !== lastSrc) {
    lastSrc = src;
    silenceVideo(node as HTMLVideoElement);
    (node as HTMLVideoElement).load();
  }

  $: if (node) {
    syncPlayback(active);
  }

  onMount(() => {
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    layout();
  });

  onDestroy(() => {
    window.removeEventListener('resize', layout);
    window.removeEventListener('orientationchange', layout);
  });
</script>

<div class="slot" bind:this={frame}>
  {#if kind === 'video'}
    <video
      bind:this={node}
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      on:loadedmetadata={onReady}
      on:loadeddata={layout}
      on:canplay={onReady}
      on:ended={onEnded}
      on:error={onError}
      on:volumechange={onVolumeChange}
      on:play={onVolumeChange}
      style="left:{rect.left}px;top:{rect.top}px;width:{rect.width}px;height:{rect.height}px"
    >
      <source {src} type={mime} />
    </video>
  {:else}
    <img
      bind:this={node}
      {src}
      alt=""
      draggable="false"
      on:load={onReady}
      style="left:{rect.left}px;top:{rect.top}px;width:{rect.width}px;height:{rect.height}px"
    />
  {/if}
</div>

<style>
  .slot {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  video,
  img {
    position: absolute;
    display: block;
    border: 0;
    max-width: none;
    max-height: none;
    pointer-events: none;
  }
</style>
