import DOMPurify from 'isomorphic-dompurify';

export function sanitizeString(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

export function sanitizeHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'style'],
  });
}

export function sanitizeDashboardConfig(configJson: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(configJson);
  } catch {
    throw new Error('Invalid JSON configuration');
  }

  const sanitizeValue = (val: unknown): unknown => {
    if (typeof val === 'string') {
      return sanitizeString(val);
    } else if (Array.isArray(val)) {
      return val.map(sanitizeValue);
    } else if (typeof val === 'object' && val !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(val)) {
        sanitized[key] = sanitizeValue(value);
      }
      return sanitized;
    }
    return val;
  };

  const sanitized = sanitizeValue(parsed);
  return JSON.stringify(sanitized);
}

export function sanitizeWidgetTitle(title: string): string {
  return sanitizeString(title).slice(0, 100);
}

export function sanitizeAnnotation(annotation: string): string {
  return sanitizeString(annotation).slice(0, 500);
}

export function sanitizeMetricName(name: string): string {
  return sanitizeString(name).slice(0, 50);
}