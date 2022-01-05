import axios from 'axios';
import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URI } from '../util/secrets';

const ERROR_NO_DATA = 'Could not find an youtube data for this accesstoken';

axios.defaults.baseURL = 'https://api.twitter.com';

export default class YouTubeDataService {
    static async getUser(accessToken: string) {
        try {
            const r = await axios({
                url: '/2/users/me',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return {
                user: r.data.data,
            };
        } catch (error) {
            return { error };
        }
    }

    static async getTweets(accessToken: string) {
        try {
            const { user } = await this.getUser(accessToken);
            if (!user) throw new Error('Could not find Twitter user.');
            const r = await axios({
                url: `/2/users/${user.id}/tweets`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return {
                tweets: r.data.data,
            };
        } catch (error) {
            return { error };
        }
    }

    static async refreshTokens(refreshToken: string) {
        try {
            const body = new URLSearchParams();
            body.append('refresh_token', refreshToken);
            body.append('grant_type', 'refresh_token');
            body.append('client_id', TWITTER_CLIENT_ID);

            const r = await axios({
                url: 'https://api.twitter.com/2/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization':
                        'Basic ' + Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64'),
                },
                data: body,
            });

            if (r.status !== 200) {
                throw new Error('Failed to request access token');
            }

            return {
                tokens: r.data,
            };
        } catch (error) {
            return { error };
        }
    }

    static async requestTokens(code: string) {
        try {
            const body = new URLSearchParams();
            body.append('code', code);
            body.append('grant_type', 'authorization_code');
            body.append('client_id', TWITTER_CLIENT_ID);
            body.append('redirect_uri', TWITTER_REDIRECT_URI);
            body.append('code_verifier', 'challenge');

            const r = await axios({
                url: 'https://api.twitter.com/2/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization':
                        'Basic ' + Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64'),
                },
                data: body,
            });

            if (r.status !== 200) {
                throw new Error('Failed to request access token');
            }

            return {
                tokens: r.data,
            };
        } catch (error) {
            return { error };
        }
    }
}
