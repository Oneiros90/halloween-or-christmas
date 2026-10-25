<script lang="ts">
  import { addOffset, type ClockUnit } from './clock';

  export let date: Date;
  export let onChange: () => void;

  const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'long' });

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

  function monthNameOf(value: Date): string {
    const name = monthFormat.format(value);
    if (!name) {
      return '';
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  $: day = date.getDate();
  $: monthName = monthNameOf(date);
  $: year = date.getFullYear();
  $: hour = date.getHours();
  $: minute = date.getMinutes();
  $: second = date.getSeconds();
</script>

<div class="timer">
  <div class="time">
    <span on:wheel|preventDefault|stopPropagation={(e) => wheel('hour', e)}>{pad(hour, 2)}</span><span class="sep">:</span><span
      on:wheel|preventDefault|stopPropagation={(e) => wheel('minute', e)}>{pad(minute, 2)}</span
    ><span class="sep">:</span><span on:wheel|preventDefault|stopPropagation={(e) => wheel('second', e)}>{pad(second, 2)}</span>
  </div>
  <div class="date">
    <span on:wheel|preventDefault|stopPropagation={(e) => wheel('day', e)}>{day}</span>
    {' '}
    <span class="month" on:wheel|preventDefault|stopPropagation={(e) => wheel('month', e)}>{monthName}</span>
    {' '}
    <span on:wheel|preventDefault|stopPropagation={(e) => wheel('year', e)}>{year}</span>
  </div>
</div>

<style>
  .timer {
    position: absolute;
    right: 4vw;
    bottom: 4vh;
    z-index: 20;
    color: #fff;
    text-align: right;
    white-space: nowrap;
    pointer-events: auto;
    text-shadow: 0 0 6px #000, 0 2px 12px #000;
    -webkit-user-select: none;
    user-select: none;
  }

  .time {
    font-family: "Big Shoulders Display", "Arial Narrow", "Helvetica Neue", sans-serif;
    font-size: 9.4vw;
    font-weight: 700;
    line-height: 0.86;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums lining-nums;
    -webkit-font-feature-settings: "tnum" 1, "lnum" 1;
    font-feature-settings: "tnum" 1, "lnum" 1;
  }

  .date {
    margin-top: 0.8vw;
    font-family: "Cormorant Garamond", Palatino, "Palatino Linotype", serif;
    font-size: 2.55vw;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.08em;
  }

  span {
    display: inline;
    cursor: default;
  }

  .sep {
    pointer-events: none;
    margin: 0 0.02em;
  }

  .month {
    margin: 0;
  }
</style>
