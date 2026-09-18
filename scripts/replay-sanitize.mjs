// Public replay contains only standard DOM replay events, never provider endpoints.
// Use only for the original synthetic retry lab, not arbitrary customer sessions.
export function sanitizeReplay(events) {
  if (!Array.isArray(events) || !events.length) throw Error('Empty replay');
  function clean(value) {
    if (typeof value === 'string') {
      const text = value.replace(/https?:\/\/[^\s"'<>]+/gi, '/retry-lab');
      if (
        /slr_live_|pt_token|x-pinetree-preview-token|Bearer\s|-----BEGIN .*PRIVATE KEY/i.test(
          text,
        )
      )
        throw Error('Sensitive replay content');
      return text;
    }
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') {
      if (String(value.tagName).toLowerCase() === 'script')
        return clean({
          ...value,
          tagName: 'noscript',
          attributes: {},
          childNodes: [],
        });
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => {
          if (
            /^(?:token|authorization|cookie|password|sessionId|sandboxId)$/i.test(
              key,
            )
          )
            throw Error('Sensitive replay field');
          if (key.startsWith('on') && typeof item === 'string')
            return [key, ''];
          return [key, clean(item)];
        }),
      );
    }
    return value;
  }
  const rows = events
    .filter((event) => [0, 1, 2, 3, 4].includes(event.type))
    .map((event) => {
      if (
        !Number.isFinite(event.timestamp) ||
        !event.data ||
        typeof event.data !== 'object'
      )
        throw Error('Invalid replay event');
      return clean({
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
      });
    });
  if (!rows.some((row) => row.type === 2))
    throw Error('Replay missing DOM snapshot');
  return rows;
}
