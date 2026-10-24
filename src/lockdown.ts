function block(event: Event): void {
  event.preventDefault();
}

function isZoomKey(event: KeyboardEvent): boolean {
  if (!event.ctrlKey && !event.metaKey) {
    return false;
  }
  const key = event.key;
  const code = event.keyCode;
  return (
    key === '+' ||
    key === '-' ||
    key === '=' ||
    key === '_' ||
    key === '0' ||
    code === 187 ||
    code === 189 ||
    code === 48 ||
    code === 107 ||
    code === 109
  );
}

export function lockPage(): void {
  document.addEventListener('wheel', block, { passive: false, capture: true });
  document.addEventListener('touchmove', block, { passive: false, capture: true });
  document.addEventListener('selectstart', block, true);
  document.addEventListener('dragstart', block, true);
  document.addEventListener('gesturestart', block, true);
  document.addEventListener('gesturechange', block, true);
  document.addEventListener('gestureend', block, true);
  document.addEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (isZoomKey(event)) {
        event.preventDefault();
      }
    },
    true
  );
}
