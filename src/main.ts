import App from './App.svelte';
import { lockPage } from './lockdown';

function start(): void {
  lockPage();
  const target = document.body;
  if (!target) {
    return;
  }
  new App({ target: target });
}

if (document.body) {
  start();
} else if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', start);
} else {
  window.onload = start;
}
