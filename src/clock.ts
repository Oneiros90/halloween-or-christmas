export type ClockUnit = 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second';

let offsetMs = 0;

export function getVirtualDate(): Date {
  return new Date(Date.now() + offsetMs);
}

export function addUnit(date: Date, unit: ClockUnit, delta: number): Date {
  const next = new Date(date.getTime());

  if (unit === 'second') {
    next.setSeconds(next.getSeconds() + delta);
    return next;
  }

  if (unit === 'minute') {
    next.setMinutes(next.getMinutes() + delta);
    return next;
  }

  if (unit === 'hour') {
    next.setHours(next.getHours() + delta);
    return next;
  }

  if (unit === 'day') {
    next.setDate(next.getDate() + delta);
    return next;
  }

  if (unit === 'month') {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + delta);
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, last));
    return next;
  }

  const day = next.getDate();
  const month = next.getMonth();
  next.setDate(1);
  next.setFullYear(next.getFullYear() + delta);
  next.setMonth(month);
  const last = new Date(next.getFullYear(), month + 1, 0).getDate();
  next.setDate(Math.min(day, last));
  return next;
}

export function addOffset(unit: ClockUnit, steps: number): void {
  if (steps === 0) {
    return;
  }
  const from = getVirtualDate();
  const to = addUnit(from, unit, steps);
  offsetMs += to.getTime() - from.getTime();
}
