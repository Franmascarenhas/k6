import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * SPIKE TEST
 * Objetivo: testar pico repentino de tráfego e capacidade de recuperação.
 *
 * Padrão:
 * - baseline (10 VUs)
 * - spike rápido para 100 VUs (5s)
 * - segura no pico
 * - desce para baseline e finaliza
 */
export const options = {
  stages: [
    { duration: '20s', target: 10 },  // baseline (normal)
    { duration: '5s', target: 100 },  // SPIKE (pico repentino)
    { duration: '30s', target: 100 }, // segurar o pico
    { duration: '10s', target: 10 },  // descer rápido (recuperação)
    { duration: '20s', target: 0 },   // finaliza
  ],
  thresholds: {
    // Em spike/stress, deixamos thresholds flexíveis para observar comportamento
    http_req_failed: ['rate<0.6'],
    http_req_duration: ['p(95)<2000'],
  },
};

export function setup() {
  const loginRes = http.post(
    'https://dummyjson.com/auth/login',
    JSON.stringify({
      username: 'emilys',
      password: 'emilyspass',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'POST /auth/login' },
    }
  );

  check(loginRes, {
    'login ok (200)': (r) => r.status === 200,
    'login tem accessToken': (r) => !!r.json('accessToken'),
  });

  return { token: loginRes.json('accessToken') };
}

export default function (data) {
  const res = http.get('https://dummyjson.com/auth/me', {
    headers: { Authorization: `Bearer ${data.token}` },
    tags: { name: 'GET /auth/me' },
  });

  // Checks instrumentados para descobrir o tipo de falha dominante
  check(res, {
    'me 200': (r) => r.status === 200,
    'me 401/403 auth': (r) => r.status === 401 || r.status === 403,
    'me 429 rate limit': (r) => r.status === 429,
    'me 5xx server': (r) => r.status >= 500,
  });

  // pausa curta para manter pressão e ainda simular uma leve "respiração"
  sleep(2);
}
