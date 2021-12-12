import { google } from 'googleapis';
import { AccountDocument } from '../models/Account';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from './secrets';

const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

google.options({ auth: client });

export const googleLoginUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/youtube.readonly'],
});

export async function getGoogleTokens(code: string) {
    const res = await client.getToken(code);
    return res.tokens;
}

export async function getYoutubeClient(account: AccountDocument) {
    client.setCredentials({
        access_token: account.googleAccessToken,
    });

    if (Date.now() > account.googleAccessTokenExpires) {
        client.setCredentials({
            access_token: account.googleAccessToken,
            refresh_token: account.googleRefreshToken,
        });
        const { credentials } = await client.refreshAccessToken();

        account.googleAccessToken = credentials.access_token;
        account.googleAccessTokenExpires = credentials.expiry_date;

        await account.save();
    }

    return google.youtube({ version: 'v3' });
}
