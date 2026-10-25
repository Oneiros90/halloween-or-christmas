import { THEME_IDS, type ThemeId } from './generated/manifest';

type AudioContextCtor = new () => AudioContext;

const buffers: Partial<Record<ThemeId, AudioBuffer>> = {};
const pending: Partial<Record<ThemeId, Promise<AudioBuffer | null>>> = {};
const paths: Partial<Record<ThemeId, string>> = {};

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let wanted: ThemeId | null = null;
let playingId: ThemeId | null = null;
let unlockBound = false;

function contextCtor(): AudioContextCtor | null {
  const win = window as Window & {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  if (win.AudioContext) {
    return win.AudioContext;
  }
  if (win.webkitAudioContext) {
    return win.webkitAudioContext;
  }
  return null;
}

function getCtx(): AudioContext | null {
  if (ctx && ctx.state !== 'closed') {
    return ctx;
  }
  const Ctor = contextCtor();
  if (!Ctor) {
    return null;
  }
  ctx = new Ctor();
  gain = ctx.createGain();
  gain.gain.value = 1;
  gain.connect(ctx.destination);
  return ctx;
}

function markState(): void {
  try {
    document.body.setAttribute('data-music', playingId || '');
    document.body.setAttribute('data-audio', ctx ? ctx.state : 'none');
  } catch (err) {
    void err;
  }
}

function resumeCtx(): void {
  const context = getCtx();
  if (!context || context.state !== 'suspended') {
    markState();
    return;
  }
  const resume = context.resume();
  if (resume && resume.then) {
    resume.then(markState, markState);
  } else {
    markState();
  }
}

function copyBuffer(data: ArrayBuffer): ArrayBuffer {
  const out = new ArrayBuffer(data.byteLength);
  new Uint8Array(out).set(new Uint8Array(data));
  return out;
}

function decodeAudio(context: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  const copy = copyBuffer(data);
  return new Promise((resolve, reject) => {
    let settled = false;
    const ok = (buffer: AudioBuffer) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(buffer);
    };
    const fail = (err?: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(err || new Error('decode failed'));
    };
    try {
      const result = (
        context.decodeAudioData as (
          audioData: ArrayBuffer,
          success?: (buffer: AudioBuffer) => void,
          error?: (err?: unknown) => void
        ) => Promise<AudioBuffer> | void
      )(copy, ok, fail);
      if (result && typeof result.then === 'function') {
        result.then(ok, fail);
      }
    } catch (err) {
      fail(err);
    }
  });
}

function loadArrayBuffer(url: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onreadystatechange = () => {
      if (req.readyState !== 4) {
        return;
      }
      if (req.status >= 200 && req.status < 300 && req.response) {
        resolve(req.response as ArrayBuffer);
        return;
      }
      reject(new Error('music load failed'));
    };
    req.onerror = () => {
      reject(new Error('music load failed'));
    };
    req.send();
  });
}

function loadBuffer(id: ThemeId, url: string): Promise<AudioBuffer | null> {
  if (buffers[id] && paths[id] === url) {
    return Promise.resolve(buffers[id] as AudioBuffer);
  }
  if (pending[id] && paths[id] === url) {
    return pending[id] as Promise<AudioBuffer | null>;
  }
  const work = loadArrayBuffer(url)
    .then((data) => {
      if (paths[id] !== url) {
        return null;
      }
      const context = getCtx();
      if (!context) {
        return null;
      }
      return decodeAudio(context, data);
    })
    .then((buffer) => {
      if (paths[id] !== url) {
        return null;
      }
      if (buffer) {
        buffers[id] = buffer;
      }
      delete pending[id];
      return buffer;
    })
    .catch(() => {
      delete pending[id];
      return null;
    });
  pending[id] = work;
  return work;
}

function stopSource(): void {
  if (!source) {
    playingId = null;
    return;
  }
  try {
    source.onended = null;
    source.stop();
  } catch (err) {
    void err;
  }
  try {
    source.disconnect();
  } catch (err) {
    void err;
  }
  source = null;
  playingId = null;
  markState();
}

function pageHidden(): boolean {
  const doc = document as Document & { webkitHidden?: boolean };
  if (typeof doc.hidden !== 'undefined') {
    return doc.hidden;
  }
  return !!doc.webkitHidden;
}

function startWanted(): void {
  if (pageHidden()) {
    return;
  }
  const id = wanted;
  if (!id) {
    stopSource();
    return;
  }
  const url = paths[id];
  if (!url) {
    stopSource();
    return;
  }
  const buffer = buffers[id];
  if (!buffer) {
    loadBuffer(id, url).then(() => {
      if (wanted === id) {
        startWanted();
      }
    });
    return;
  }
  resumeCtx();
  if (playingId === id && source) {
    return;
  }
  const context = getCtx();
  if (!context || !gain) {
    return;
  }
  stopSource();
  const next = context.createBufferSource();
  next.buffer = buffer;
  next.loop = true;
  next.connect(gain);
  next.onended = () => {
    if (wanted === id && playingId === id) {
      playingId = null;
      source = null;
      startWanted();
    }
  };
  try {
    next.start(0);
    source = next;
    playingId = id;
  } catch (err) {
    void err;
    source = null;
    playingId = null;
  }
  markState();
}

function tryUnlock(): void {
  resumeCtx();
  startWanted();
}

function ensureUnlock(): void {
  if (unlockBound) {
    return;
  }
  unlockBound = true;
  const events = [
    'click',
    'keydown',
    'keyup',
    'keypress',
    'touchstart',
    'touchend',
    'pointerdown',
    'pointerup',
    'mousedown',
    'mouseup',
    'wheel',
  ];
  for (let i = 0; i < events.length; i += 1) {
    document.addEventListener(events[i], tryUnlock, true);
    window.addEventListener(events[i], tryUnlock, true);
  }
  document.addEventListener('visibilitychange', () => {
    if (pageHidden()) {
      stopSource();
      return;
    }
    tryUnlock();
  });
  document.addEventListener('webkitvisibilitychange', () => {
    if (pageHidden()) {
      stopSource();
      return;
    }
    tryUnlock();
  });
}

export function unlockMusic(): void {
  ensureUnlock();
  tryUnlock();
}

export function attachMusic(id: ThemeId, url: string): void {
  ensureUnlock();
  if (paths[id] === url && (buffers[id] || pending[id])) {
    return;
  }
  paths[id] = url;
  delete buffers[id];
  delete pending[id];
  loadBuffer(id, url).then(() => {
    if (wanted === id) {
      startWanted();
    }
  });
}

export function setMusicTheme(id: ThemeId): void {
  ensureUnlock();
  wanted = id;
  for (let i = 0; i < THEME_IDS.length; i += 1) {
    if (THEME_IDS[i] !== id && playingId === THEME_IDS[i]) {
      stopSource();
      break;
    }
  }
  startWanted();
}
