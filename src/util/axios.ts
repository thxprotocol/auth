import axios, { AxiosRequestConfig } from 'axios';
import { TWITTER_API_ENDPOINT } from './secrets';

export function twitterClient(config: AxiosRequestConfig) {
    config.baseURL = TWITTER_API_ENDPOINT;
    return axios(config);
}
