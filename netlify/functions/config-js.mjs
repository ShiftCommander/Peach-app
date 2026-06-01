export default async () => {
  const apiUrl = globalThis.Netlify?.env?.get('PEACH_PUBLIC_GLOBAL_TUNING_API_URL')
    || '/api/tunings/search';
  const body = [
    'window.PEACH_CONFIG = window.PEACH_CONFIG || {};',
    `window.PEACH_CONFIG.globalTuningApiUrl = ${JSON.stringify(apiUrl)};`,
    'window.PEACH_GLOBAL_TUNING_API_URL = window.PEACH_GLOBAL_TUNING_API_URL || window.PEACH_CONFIG.globalTuningApiUrl || "";'
  ].join('\n');

  return new Response(`${body}\n`, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};

export const config = {
  path: '/config.js',
  preferStatic: false
};
