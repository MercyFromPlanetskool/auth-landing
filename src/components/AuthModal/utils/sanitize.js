// utils/sanitize.js
// Small helpers to sanitize various text inputs safely
export const sanitizeInput = (value, type = 'text') => {
  if (!value) return '';

  // Strip script tags and HTML
  const cleaned = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .trim();

  switch (type) {
    case 'name':
      return cleaned.replace(/[^a-zA-Z\s'-]/g, '').substring(0, 50);
    case 'username':
      return cleaned.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 30);
    case 'email':
      return cleaned.toLowerCase().substring(0, 254);
    case 'password':
      // Never alter passwords contentally, just validate elsewhere
      return value;
    default:
      return cleaned;
  }
};
