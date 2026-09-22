/** Sort dated messages stably without assigning invented times to legacy messages. */
export function chronologicalMessages(messages = []) {
  const dated = messages.filter((message) => Number.isFinite(Date.parse(message.createdAt)))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  let index = 0;
  return messages.map((message) => Number.isFinite(Date.parse(message.createdAt)) ? dated[index++] : message);
}

export function messageTimestamp(createdAt, locale = undefined) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return null;
  return {
    iso: date.toISOString(),
    label: date.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    full: date.toLocaleString(locale, { dateStyle: "full", timeStyle: "long" }),
  };
}
