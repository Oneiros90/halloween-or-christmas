<script lang="ts">
  import { addOffset, type ClockUnit } from './clock';

  export let date: Date;
  export let onChange: () => void;

  const acc: Record<ClockUnit, number> = {
    day: 0,
    month: 0,
    year: 0,
    hour: 0,
    minute: 0,
    second: 0,
  };
  const THRESHOLD = 40;

  function pad(value: number, width: number): string {
    let text = String(value);
    while (text.length < width) {
      text = '0' + text;
    }
    return text;
  }

  function wheel(unit: ClockUnit, event: WheelEvent): void {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY;
    if (!delta) {
      return;
    }
    acc[unit] += delta;
    if (Math.abs(acc[unit]) < THRESHOLD && Math.abs(delta) < THRESHOLD) {
      return;
    }
    const steps = acc[unit] < 0 ? 1 : -1;
    acc[unit] = 0;
    addOffset(unit, steps);
    onChange();
  }

  $: day = date.getDate();
  $: month = date.getMonth() + 1;
  $: year = date.getFullYear();
  $: hour = date.getHours();
  $: minute = date.getMinutes();
  $: second = date.getSeconds();
</script>

<div class="timer">
  <div class="row">
    <span on:wheel|preventDefault|stopPropagation={(e) => wheel('day', e)}>{pad(day, 2)}</span><span class="sep">.</span><span
      on:wheel|preventDefault|stopPropagation={(e) => wheel('month', e)}>{pad(month, 2)}</span
    ><span class="sep">.</span><span on:wheel|preventDefault|stopPropagation={(e) => wheel('year', e)}>{pad(year, 4)}</span>
  </div>
  <div class="row">
    <span on:wheel|preventDefault|stopPropagation={(e) => wheel('hour', e)}>{pad(hour, 2)}</span><span class="sep">:</span><span
      on:wheel|preventDefault|stopPropagation={(e) => wheel('minute', e)}>{pad(minute, 2)}</span
    ><span class="sep">:</span><span on:wheel|preventDefault|stopPropagation={(e) => wheel('second', e)}>{pad(second, 2)}</span>
  </div>
</div>

<style>
  .timer {
    position: absolute;
    right: 4vw;
    bottom: 4vh;
    z-index: 20;
    color: #fff;
    font-family: "Courier New", Courier, monospace;
    font-size: 4.6vw;
    line-height: 1.05;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
    pointer-events: auto;
    text-shadow: 0 0 4px #000, 0 2px 8px #000;
    -webkit-user-select: none;
    user-select: none;
  }

  .row {
    display: block;
  }

  span {
    display: inline;
    cursor: default;
  }

  .sep {
    pointer-events: none;
    display: inline-block;
    width: 0.45em;
    margin: 0 -0.05em;
    text-align: center;
  }
</style>
