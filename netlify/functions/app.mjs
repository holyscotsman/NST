/* The NST account system on Netlify: sign in, sign up, sign out, change password, the administrator console,
 * the one-time /setup, and the JSON API (/api/me, /api/progress) that shared/nst-sync.js talks to.
 * All the behaviour is in netlify/lib/app.mjs; this file only wires it to Netlify Database and the runtime. */
import { getDatabase } from '@netlify/database';
import { createApp } from '../lib/app.mjs';
import { makeStore } from '../lib/store.mjs';
import { queryFrom } from '../lib/db.mjs';
import { NST_VERSION } from '../lib/version.mjs';

let handler;

export default async (request, context) => {
  if (!handler) {
    handler = createApp({
      store: makeStore(queryFrom(getDatabase())),
      env: (k) => Netlify.env.get(k),
      version: NST_VERSION,
    });
  }
  return handler(request, { ip: context.ip });
};

export const config = {
  path: ['/login', '/signup', '/logout', '/setup', '/account/*', '/admin', '/admin/*', '/api/me', '/api/progress'],
};
