import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export const rate_limit_429 = new Counter('rate_limit_429');

export const options = {
  stages: [
    { duration: '30s', target: 30 },
    { duration: '4m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
    rate_limit_429: ['count<50'],
  },
};

export function setup() {
  const res = http.post(
    'https://dummyjson.com/auth/login',
    JSON.stringify({ username: 'emilys', password: 'emilyspass' }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST /auth/login' } }
  );

  check(res, {
    'login ok (200)': (r) => r.status == 200,
    'login tem accessToken': (r) => !!r.json('accessToken'),
  });

  return { token: res.json('accessToken') };
}

export default function (data) {
  const res = http.get('https://dummyjson.com/auth/me', {
    headers: { Authorization: 'Bearer ' + data.token },
    tags: { name: 'GET /auth/me' },
  });

  if (res.status == 429) {
    rate_limit_429.add(1);
  }

  check(res, { 'me 200': (r) => r.status == 200 });

  sleep(2);
}
