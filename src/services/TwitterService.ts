import axios from 'axios';
import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URI } from '../util/secrets';

const ERROR_NO_DATA = 'Could not find an youtube data for this accesstoken';
const ERROR_NOT_AUTHORIZED = 'Not authorized for Twitter API';
const ERROR_TOKEN_REQUEST_FAILED = 'Failed to request access token';

axios.defaults.baseURL = 'https://api.twitter.com';

export default class YouTubeDataService {
    static async validateLike(accessToken: string, channelItem: string) {
        try {
            const { user } = await this.getUser(accessToken);
            if (!user) throw new Error('Could not find Twitter user.');

            const r = await axios({
                url: `/2/tweets/${channelItem}/liking_users`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            return {
                result: r.data.data ? !!r.data.data.filter((u: { id: number }) => u.id === user.id).length : false,
            };
        } catch (error) {
            return { error };
        }
    }

    static async validateRetweet(accessToken: string, channelItem: string) {
        try {
            const { user } = await this.getUser(accessToken);
            if (!user) throw new Error('Could not find Twitter user.');

            const r = await axios({
                url: `/2/tweets/${channelItem}/retweeted_by`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            return {
                result: r.data.data ? !!r.data.data.filter((u: { id: number }) => u.id === user.id).length : false,
            };
        } catch (error) {
            return { error };
        }
    }

    static async validateFollow(accessToken: string, channelItem: string) {
        try {
            const { user } = await this.getUser(accessToken);
            if (!user) throw new Error('Could not find Twitter user.');

            const r = await axios({
                url: `/2/users/${channelItem}/followers`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            return {
                result: r.data.data ? !!r.data.data.filter((u: { id: number }) => u.id === user.id).length : false,
            };
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

    static async getTweets(accessToken: string) {
        try {
            const { user } = await this.getUser(accessToken);
            if (!user) throw new Error('Could not find Twitter user.');
            const r = await axios({
                url: `/2/users/${user.id}/tweets?tweet.fields=created_at,in_reply_to_user_id,conversation_id`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            return { tweets: r.data.data };
        } catch (error) {
            return { error };
        }
    }

    static async refreshTokens(refreshToken: string) {
        try {
            const data = new URLSearchParams();
            data.append('refresh_token', refreshToken);
            data.append('grant_type', 'refresh_token');
            data.append('client_id', TWITTER_CLIENT_ID);

            const r = await axios({
                url: '/2/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization':
                        'Basic ' + Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64'),
                },
                data,
            });

            if (r.status !== 200) throw new Error(ERROR_TOKEN_REQUEST_FAILED);

            return { tokens: r.data };
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
                url: '/2/oauth2/token',
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

            return { tokens: r.data };
        } catch (error) {
            return { error };
        }
    }
}
