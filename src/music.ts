import { THEME_IDS, type ThemeId } from './generated/manifest';

const players: Partial<Record<ThemeId, HTMLAudioElement>> = {};

let wanted: ThemeId | null = null;
let waitingUnlock = false;
let unlockBound = false;

function ensureUnlock(): void {
  if (unlockBound) {
    return;
  }
  unlockBound = true;

  const tryUnlock = () => {
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
  };

  document.addEventListener('click', tryUnlock, true);
  document.addEventListener('keydown', tryUnlock, true);
  document.addEventListener('touchstart', tryUnlock, true);
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
    audio.setAttribute('playsinline', 'true');
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
    document.body.appendChild(audio);
    players[id] = audio;
  }
  if (audio.src !== url) {
    audio.src = url;
    audio.load();
  }
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
