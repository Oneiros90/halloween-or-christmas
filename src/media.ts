export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function scaled(mediaW: number, mediaH: number, viewW: number, viewH: number, cover: boolean): Rect {
  if (!mediaW || !mediaH || !viewW || !viewH) {
    return { left: 0, top: 0, width: viewW, height: viewH };
  }

  const scale = cover
    ? Math.max(viewW / mediaW, viewH / mediaH)
    : Math.min(viewW / mediaW, viewH / mediaH);
  const width = mediaW * scale;
  const height = mediaH * scale;

  return {
    left: Math.round((viewW - width) / 2),
    top: Math.round((viewH - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function coverRect(mediaW: number, mediaH: number, viewW: number, viewH: number): Rect {
  return scaled(mediaW, mediaH, viewW, viewH, true);
}

export function containRect(mediaW: number, mediaH: number, viewW: number, viewH: number): Rect {
  return scaled(mediaW, mediaH, viewW, viewH, false);
}

export function silenceVideo(video: HTMLVideoElement): void {
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.setAttribute('muted', '');
}

export function mimeFromPath(path: string, kind: 'image' | 'video' | 'audio'): string {
  const clean = path.split('?')[0];
  const dot = clean.lastIndexOf('.');
  const ext = dot === -1 ? '' : clean.slice(dot).toLowerCase();

  if (kind === 'video') {
    if (ext === '.webm') {
      return 'video/webm';
    }
    if (ext === '.ogv') {
      return 'video/ogg';
    }
    return 'video/mp4';
  }

  if (kind === 'audio') {
    if (ext === '.ogg') {
      return 'audio/ogg';
    }
    if (ext === '.wav') {
      return 'audio/wav';
    }
    if (ext === '.m4a') {
      return 'audio/mp4';
    }
    if (ext === '.aac') {
      return 'audio/aac';
    }
    if (ext === '.mp3') {
      return 'audio/mp3';
    }
    return 'audio/mpeg';
  }

  if (ext === '.png') {
    return 'image/png';
  }
  if (ext === '.webp') {
    return 'image/webp';
  }
  if (ext === '.gif') {
    return 'image/gif';
  }
  return 'image/jpeg';
}
