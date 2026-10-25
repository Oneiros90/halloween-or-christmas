import { THEME_IDS, type ThemeId } from './generated/manifest';
import { mimeFromPath } from './media';

const players: Partial<Record<ThemeId, HTMLAudioElement>> = {};

let wanted: ThemeId | null = null;
let waitingUnlock = false;
let unlockBound = false;

function tryUnlock(): void {
  if (!waitingUnlock || !wanted) {
    return;
  }
  const audio = players[wanted];
  if (!audio) {
    waitingUnlock = false;
    return;
  }
  const play = audio.play();
  if (play && play.then) {
    play
      .then(() => {
        waitingUnlock = false;
      })
      .catch(() => {
        waitingUnlock = true;
      });
  }
}

function ensureUnlock(): void {
  if (unlockBound) {
    return;
  }
  unlockBound = true;
  document.addEventListener('click', tryUnlock, true);
  document.addEventListener('keydown', tryUnlock, true);
  document.addEventListener('keyup', tryUnlock, true);
  document.addEventListener('touchstart', tryUnlock, true);
  document.addEventListener('pointerdown', tryUnlock, true);
  document.addEventListener('mousedown', tryUnlock, true);
  document.addEventListener('wheel', tryUnlock, true);
}

function stop(audio: HTMLAudioElement): void {
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch (err) {
    void err;
  }
}

export function attachMusic(id: ThemeId, url: string): void {
  let audio = players[id];
  if (!audio) {
    audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.loop = true;
    audio.controls = false;
    audio.autoplay = false;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.addEventListener('ended', () => {
      try {
        audio!.currentTime = 0;
      } catch (err) {
        void err;
      }
      if (wanted === id) {
        const play = audio!.play();
        if (play && play.catch) {
          play.catch(() => {
            waitingUnlock = true;
          });
        }
      }
    });
    audio.addEventListener('canplay', () => {
      if (wanted === id && waitingUnlock) {
        tryUnlock();
      }
    });
    document.body.appendChild(audio);
    players[id] = audio;
  }

  if (audio.getAttribute('data-path') === url) {
    return;
  }

  audio.setAttribute('data-path', url);
  while (audio.firstChild) {
    audio.removeChild(audio.firstChild);
  }
  const source = document.createElement('source');
  source.src = url;
  source.type = mimeFromPath(url, 'audio');
  audio.appendChild(source);
  audio.load();
}

export function setMusicTheme(id: ThemeId): void {
  ensureUnlock();
  wanted = id;

  for (let i = 0; i < THEME_IDS.length; i += 1) {
    const themeId = THEME_IDS[i];
    const audio = players[themeId];
    if (!audio) {
      continue;
    }
    if (themeId === id) {
      continue;
    }
    stop(audio);
  }

  const next = players[id];
  if (!next) {
    waitingUnlock = false;
    return;
  }

  try {
    next.currentTime = 0;
  } catch (err) {
    void err;
  }

  const play = next.play();
  if (play && play.then) {
    play
      .then(() => {
        waitingUnlock = false;
      })
      .catch(() => {
        waitingUnlock = true;
      });
  }
}
