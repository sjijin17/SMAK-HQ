const MANILA_TIME_ZONE = 'Asia/Manila';

export function getManilaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getManilaDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function getManilaTimeZone() {
  return MANILA_TIME_ZONE;
}
