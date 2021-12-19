import axios from 'axios';
import FormData from 'form-data';
import { TWITTER_CLIENT_ID, TWITTER_REDIRECT_URI } from './secrets';

export function getTwitterLoginURL(uid: string) {
    const scopes = 'tweet.read%20users.read%20offline.access';

    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${TWITTER_REDIRECT_URI}&scope=${scopes}&code_challenge=challenge&code_challenge_method=plain&state=${uid}`;
}

export async function getTwitterTokens(code: string) {
    try {
        const body = new FormData();
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
