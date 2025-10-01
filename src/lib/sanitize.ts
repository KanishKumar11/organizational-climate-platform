import DOMPurify from 'dompurify';

// Client-side sanitization utilities
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
};

export const sanitizeText = (text: string): string => {
  // For plain text display, escape HTML entities
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
