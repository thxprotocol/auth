import { TWITTER_CLIENT_ID, TWITTER_REDIRECT_URI } from './secrets';

export const twitterScopes = 'tweet.read%20users.read%20like.read%20follows.read%20offline.access';

export function getTwitterLoginURL(uid: string) {
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${TWITTER_REDIRECT_URI}&scope=${twitterScopes}&code_challenge=challenge&code_challenge_method=plain&state=${uid}`;
}
