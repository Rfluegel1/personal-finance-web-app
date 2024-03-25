// @ts-ignore
import http from 'k6/http';
// @ts-ignore
import { sleep } from 'k6';

const virtualUsers = 10;
export const options = {
    vus: virtualUsers,
    duration: '30s',
    thresholds: {
        'http_req_duration': ['p(95)<60000']
    }
};

export default function () {
    const BASE_URL = __ENV.BASE_URL ? __ENV.BASE_URL : 'http://localhost:8090';
    const EMAIL = __ENV.EMAIL
    const PASSWORD = __ENV.PASSWORD
    const postBody = JSON.stringify({task: 'the task'});
    const putBody = JSON.stringify({task: 'the updated task'});
    // Manually construct the data for x-www-form-urlencoded content type
    const formData = `username=${encodeURIComponent(EMAIL)}&password=${encodeURIComponent(PASSWORD)}`;
    http.post(`${BASE_URL}/api/login`, formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const postResponse = http.post(`${BASE_URL}/api/todos`, postBody, { headers: { 'Content-Type': 'application/json' } });
    const id = JSON.parse(postResponse.body).message.id;
    http.get(`${BASE_URL}/api/todos/${id}`);
    http.put(`${BASE_URL}/api/todos/${id}`, putBody, { headers: { 'Content-Type': 'application/json' } });
    http.request('DELETE', `${BASE_URL}/api/todos/${id}`, null, { headers: { 'Content-Type': 'application/json' } });
    http.post(`${BASE_URL}/api/logout`);
    sleep(1);
}
