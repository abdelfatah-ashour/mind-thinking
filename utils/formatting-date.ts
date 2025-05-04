export class DateFormatter {
  static formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "2-digit",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  static formatTime(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleTimeString("en-US", options);
  }
}
