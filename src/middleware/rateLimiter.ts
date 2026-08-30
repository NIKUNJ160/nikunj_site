import { MiddlewareHandler } from 'hono';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateLimitRecord>();

// Clean up expired records periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    if (now > record.resetTime) {
      ipStore.delete(ip);
    }
  }
}, 60 * 1000);

export function rateLimiter(options: { maxRequests: number; windowMs: number }): MiddlewareHandler {
  const { maxRequests, windowMs } = options;

  return async (c, next) => {
    // Determine client IP address
    const clientIp = c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
                     c.req.header('cf-connecting-ip') ||
                     c.req.header('x-real-ip') ||
                     '127.0.0.1';

    const now = Date.now();
    const record = ipStore.get(clientIp);

    if (!record || now > record.resetTime) {
      ipStore.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      });
      return await next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      c.header('Retry-After', String(retryAfterSeconds));
      return c.html(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Too Many Requests — Nikunj Pateliya</title>
          <link rel="stylesheet" href="/assets/css/style.css">
        </head>
        <body style="display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; box-sizing:border-box;">
          <div class="bento-box" style="max-width:480px; width:100%; text-align:center;">
            <h1 style="font-size:1.8rem; margin-bottom:0.5rem; color:var(--text-primary);">Too Many Requests</h1>
            <p style="color:var(--text-secondary); margin-bottom:1.5rem; line-height:1.5;">
              You have exceeded the maximum allowed login or authentication attempts. Please try again in <strong>${retryAfterSeconds} seconds</strong>.
            </p>
            <a href="/" class="btn">Return to Home</a>
          </div>
        </body>
        </html>
      `, 429);
    }

    record.count += 1;
    return await next();
  };
}
