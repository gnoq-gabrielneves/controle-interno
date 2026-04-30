export function formatDate(date: string) {
  if (!date) return "—";
  // se já vier no formato YYYY-MM-DD converte pra DD/MM/YYYY
  const [year, month, day] = date.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return date;
}
