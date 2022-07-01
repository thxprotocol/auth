import axios from 'axios';

import { THXError } from './errors';
import { AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, API_URL, AUTH_URL } from './secrets';

class ApiAccesTokenRequestError extends THXError {
    message = 'API access token request failed';
}

let apiAccessToken = '';
let apiAccessTokenExpired = 0;

axios.defaults.baseURL = AUTH_URL;

async function requestAuthAccessToken() {
    const data = new URLSearchParams();
    data.append('grant_type', 'client_credentials');
    data.append('scope', 'openid brands:read claims:read');

    const r = await axios({
        url: AUTH_URL + '/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${AUTH_CLIENT_ID}:${AUTH_CLIENT_SECRET}`).toString('base64'),
        },
        data,
    });

    if (r.status !== 200) throw new ApiAccesTokenRequestError();

    return r.data;
}

export async function getAuthAccessToken() {
    if (Date.now() > apiAccessTokenExpired) {
        const { access_token, expires_in } = await requestAuthAccessToken();
        apiAccessToken = access_token;
        apiAccessTokenExpired = Date.now() + expires_in * 1000;
    }

    return `Bearer ${apiAccessToken}`;
}

axios.defaults.baseURL = API_URL;

export const apiClient = axios;
