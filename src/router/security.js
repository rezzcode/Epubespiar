import { validateURL } from '../utils/security';

/**
 * Security middleware for Vue router
 * @param {Object} to - Target route
 * @param {Object} from - Current route
 * @param {Function} next - Navigation guard
 */
export function securityMiddleware(to, from, next) {
  // Validate external URLs if present
  if (to.query && to.query.url) {
    if (!validateURL(to.query.url)) {
      next({ name: 'error', query: { message: 'Invalid URL' } });
      return;
    }
  }

  // Add security headers to all routes
  document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(meta => meta.remove());
  const meta = document.createElement('meta');
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";
  document.head.appendChild(meta);

  next();
} 