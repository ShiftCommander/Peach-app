export default async () => {
  return Response.json(
    { ok: true, service: 'peach-global-tuning-api' },
    { headers: { 'Cache-Control': 'no-store' } }
  );
};

export const config = {
  path: '/api/health'
};
