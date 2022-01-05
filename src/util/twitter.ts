import { TWITTER_CLIENT_ID, TWITTER_REDIRECT_URI } from './secrets';

export function getTwitterLoginURL(uid: string) {
    const scopes = 'tweet.read%20users.read%20offline.access';
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${TWITTER_REDIRECT_URI}&scope=${scopes}&code_challenge=challenge&code_challenge_method=plain&state=${uid}`;
}
