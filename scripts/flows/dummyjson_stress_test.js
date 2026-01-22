import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * STRESS TEST
 * Objetivo: descobrir o limite da API
 */
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // carga leve
    { duration: '30s', target: 30 },   // carga moderada
    { duration: '30s', target: 60 },   // acima do normal
    { duration: '30s', target: 100 },  // stress real
    { duration: '30s', target: 0 },    // recuperação
  ],

  thresholds: {
    // aqui NÃO esperamos perfeição
    http_req_failed: ['rate<0.6'],       // até 20% de falhas é aceitável no stress
    http_req_duration: ['p(95)<2000'],   // tempo vai degradar, e tudo bem
  },
};

export function setup() {
  const loginRes = http.post(
    'https://dummyjson.com/auth/login',
    JSON.stringify({
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 30,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'setup login 200': (r) => r.status === 200,
    'setup tem token': (r) => !!r.json('accessToken'),
  });

  return {
    token: loginRes.json('accessToken'),
  };
}

export default function (data) {
  const res = http.get('https://dummyjson.com/auth/me', {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  });

  check(res, {
    'me status 200': (r) => r.status === 200,
  });

  // pausa curta → pressão maior
  sleep(0.5);
}
