import axios from 'axios';
import { getConfig } from '../config/config.js';
import { parseApiError } from '../utils/errors.js';
export function createClient() {
    const { apiToken } = getConfig();
    const client = axios.create({
        baseURL: 'https://api.clickup.com/api/v2',
        headers: {
            Authorization: apiToken,
            'Content-Type': 'application/json',
        },
        timeout: 15000,
    });
    client.interceptors.response.use((res) => res, (err) => {
        throw parseApiError(err);
    });
    return client;
}
export function createClientWithToken(token) {
    const client = axios.create({
        baseURL: 'https://api.clickup.com/api/v2',
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
        timeout: 15000,
    });
    client.interceptors.response.use((res) => res, (err) => {
        throw parseApiError(err);
    });
    return client;
}
