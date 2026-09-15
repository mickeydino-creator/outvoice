// Strips anything that could execute JavaScript from a user-authored HTML/CSS
// template: <script> tags, on* event handler attributes, javascript: URLs, and
// <iframe>/<object>/<embed> tags. Templates are HTML + CSS only.
export function sanitizeHtml(html: string): string {
  let clean = html

  clean = clean.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  clean = clean.replace(/<script\b[^>]*\/?>(?!<\/script>)/gi, "")
  clean = clean.replace(/<(iframe|object|embed|link|meta)\b[^>]*>/gi, "")
  clean = clean.replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
  clean = clean.replace(/\son\w+\s*=\s*'[^']*'/gi, "")
  clean = clean.replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
  clean = clean.replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"')

  return clean
}
