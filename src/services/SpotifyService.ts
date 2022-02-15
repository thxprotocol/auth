import axios from 'axios';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } from '../util/secrets';

export const SPOTIFY_API_ENDPOINT = 'https://api.spotify.com/v1/';
export const SPOTIFY_API_SCOPE = 'user-read-private user-read-email';
const ERROR_NO_DATA = 'Could not find an youtube data for this accesstoken';
const ERROR_NOT_AUTHORIZED = 'Not authorized for Twitter API';
const ERROR_TOKEN_REQUEST_FAILED = 'Failed to request access token';

axios.defaults.baseURL = SPOTIFY_API_ENDPOINT;

export default class SpotifyDataService {
    static getSpotifyUrl(state?: string) {
        const body = new URLSearchParams();

        if (state) body.append('state', state);
        body.append('response_type', 'code');
        body.append('client_id', SPOTIFY_CLIENT_ID);
        body.append('redirect_uri', SPOTIFY_REDIRECT_URI);
        body.append('scope', SPOTIFY_API_SCOPE);

        return `https://accounts.spotify.com/authorize?${body.toString()}`;
    }

    static async requestTokens(code: string) {
        try {
            const body = new URLSearchParams();
            body.append('code', code);
            body.append('grant_type', 'authorization_code');
            body.append('redirect_uri', SPOTIFY_REDIRECT_URI);

            const r = await axios({
                url: 'https://accounts.spotify.com/api/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization':
                        'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
                },
                data: body,
            });

            if (r.status !== 200) {
                throw new Error('Failed to request access token');
            }
            return { tokens: r.data };
        } catch (error) {
            return { error };
        }
    }

    static async getUser(accessToken: string) {
        try {
            const r = await axios({
                url: 'https://api.spotify.com/v1/me',
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            return { user: r.data };
        } catch (error) {
            return { error };
        }
    }

    static async refreshTokens(refreshToken: string) {
        try {
            const r = await axios({
                url: 'https://accounts.spotify.com/api/token',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization':
                        'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
                },
                data: {
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_TOKEN_REQUEST_FAILED);

            return { tokens: r.data.access_token };
        } catch (error) {
            return { error };
        }
    }
}
