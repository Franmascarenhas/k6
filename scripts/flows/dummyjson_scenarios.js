import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // 80% tráfego: usuário já logado consultando /auth/me
    me_traffic: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 4 },
        { duration: '20s', target: 4 },
        { duration: '10s', target: 0 },
      ],
      exec: 'meFlow',
    },

    // 20% tráfego: refresh de token (menos frequente)
    refresh_traffic: {
      executor: 'ramping-vus',
      startTime: '0s',
      stages: [
        { duration: '10s', target: 1 },
        { duration: '20s', target: 1 },
        { duration: '10s', target: 0 },
      ],
      exec: 'refreshFlow',
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

// roda 1 vez: pega tokens para usar nos cenários
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
    'setup tem accessToken': (r) => !!r.json('accessToken'),
    'setup tem refreshToken': (r) => !!r.json('refreshToken'),
  });

  return {
    accessToken: loginRes.json('accessToken'),
    refreshToken: loginRes.json('refreshToken'),
  };
}

export function meFlow(data) {
  const meRes = http.get('https://dummyjson.com/auth/me', {
    headers: { Authorization: `Bearer ${data.accessToken}` },
  });

  check(meRes, { 'me 200': (r) => r.status === 200 });
  sleep(1);
}

export function refreshFlow(data) {
  const refreshRes = http.post(
    'https://dummyjson.com/auth/refresh',
    JSON.stringify({ refreshToken: data.refreshToken, expiresInMins: 30 }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(refreshRes, { 'refresh 200': (r) => r.status === 200 });
  sleep(2);
}
