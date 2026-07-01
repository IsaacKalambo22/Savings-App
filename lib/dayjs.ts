import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import startOf from "dayjs/plugin/customParseFormat";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(startOf);

export { dayjs };

export function formatDate(date: string | Date, format = "DD MMM YYYY"): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format("DD MMM YYYY, HH:mm");
}

export function fromNow(date: string | Date): string {
  return dayjs(date).fromNow();
}

export function startOfMonth(date?: string | Date): dayjs.Dayjs {
  return dayjs(date).startOf("month");
}

export function endOfMonth(date?: string | Date): dayjs.Dayjs {
  return dayjs(date).endOf("month");
}
