// utils/getWeekIndex.ts
export function getWeekIndex(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  return Math.floor(diff / oneWeek) + 1;
}
