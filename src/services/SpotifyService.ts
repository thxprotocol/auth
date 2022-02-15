import axios from 'axios';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } from '../util/secrets';

export const SPOTIFY_API_ENDPOINT = 'https://api.spotify.com';
export const SPOTIFY_API_SCOPE = 'user-read-private user-read-email';

axios.defaults.baseURL = SPOTIFY_API_ENDPOINT;

export default class SpotifyDataService {
    static async requestTokens(code: string) {
        try {
            const body = new URLSearchParams();
            body.append('state', code);
            body.append('response_type', 'code');
            body.append('client_id', SPOTIFY_CLIENT_ID);
            body.append('redirect_uri', SPOTIFY_REDIRECT_URI);
            body.append('scope', SPOTIFY_API_SCOPE);

            const r = await axios({
                url: 'https://accounts.spotify.com/api/token',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization':
                        'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
                },
                data: {
                    grant_type: 'client_credentials',
                },
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
                url: '/2/users/me',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            return { user: r.data.data };
        } catch (error) {
            return { error };
        }
    }
}
