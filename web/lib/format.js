// Date / time formatters — always display in Asia/Bangkok
// See CONVENTIONS.md §1 (Time)

/**
 * Format a UTC date string for display in Thai locale (Asia/Bangkok).
 * @param {string | Date} utcValue
 * @returns {string}  e.g. "26 พ.ย. 2569, 14:32:01"
 */
export function formatDateTime(utcValue) {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(utcValue))
}

/**
 * Format a UTC date string as date only (no time).
 * @param {string | Date} utcValue
 * @returns {string}  e.g. "26 พ.ย. 2569"
 */
export function formatDate(utcValue) {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(utcValue))
}
