import type { ThemeId } from './generated/manifest';

export function themeFor(date: Date): ThemeId {
  const month = date.getMonth();
  const day = date.getDate();

  if (month === 9) {
    return 'halloween';
  }

  if (month === 10 || month === 11) {
    return 'christmas';
  }

  if (month === 0 && day < 6) {
    return 'christmas';
  }

  return 'default';
}
