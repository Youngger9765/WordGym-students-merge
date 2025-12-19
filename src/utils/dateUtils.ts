export const formatDate = (
  timestamp: number,
  locale: string = 'zh-TW',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
) => {
  return new Date(timestamp).toLocaleString(locale, options);
};