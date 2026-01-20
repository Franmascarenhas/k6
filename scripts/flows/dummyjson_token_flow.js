import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  // 1) LOGIN -> pega accessToken + refreshToken
  const loginRes = http.post(
    'https://dummyjson.com/auth/login',
    JSON.stringify({
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 30,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const okLogin = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'tem accessToken': (r) => !!r.json('accessToken'),
    'tem refreshToken': (r) => !!r.json('refreshToken'),
  });

  // Se falhar, para aqui pra não “cascatear” erro
  if (!okLogin) {
    // ajuda a debugar sem poluir demais
    console.log(`LOGIN FALHOU: status=${loginRes.status} body=${loginRes.body}`);
    return;
  }

  const accessToken = loginRes.json('accessToken');
  const refreshToken = loginRes.json('refreshToken');

  // 2) ENDPOINT PROTEGIDO -> /auth/me com Bearer token
  const meRes = http.get('https://dummyjson.com/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  check(meRes, { 'me status 200': (r) => r.status === 200 });

  // 3) REFRESH TOKEN (gera novo accessToken)
  const refreshRes = http.post(
    'https://dummyjson.com/auth/refresh',
    JSON.stringify({ refreshToken, expiresInMins: 30 }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(refreshRes, {
    'refresh status 200': (r) => r.status === 200,
    'novo accessToken': (r) => !!r.json('accessToken'),
  });

  sleep(1);
}
