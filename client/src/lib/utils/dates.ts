export function formatRussianDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Ошибка даты :(";
  }

  const day = date.getDate();
  const monthNames = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}
