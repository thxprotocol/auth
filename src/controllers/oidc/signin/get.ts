import { Request, Response } from 'express';
import { AUTH_URL, WALLET_URL } from '../../../util/secrets';
import { SpotifyService } from '../../../services/SpotifyService';
import { TwitterService } from '../../../services/TwitterService';
import { YouTubeService } from '../../../services/YouTubeService';

function getAuthRequestMessage(uid: string) {
    const domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
    ];
    const authRequest = [
        { name: 'message', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'uid', type: 'string' },
    ];
    return JSON.stringify({
        types: {
            EIP712Domain: domain,
            AuthReqeust: authRequest,
        },
        domain: {
            name: 'THX Network',
            version: '1',
        },
        primaryType: 'AuthReqeust',
        message: {
            message:
                "Welcome! Please make sure you have selected your preferred account and sign this message to verify it's ownership.",
            app: AUTH_URL,
            uid,
        },
    });
}

async function controller(req: Request, res: Response) {
    const { uid, params } = req.interaction;
    params.googleLoginUrl = YouTubeService.getLoginUrl(req.params.uid, YouTubeService.getBasicScopes());

    if (params.return_url === WALLET_URL) {
        params.twitterLoginUrl = TwitterService.getLoginURL(uid, {});
        params.spotifyLoginUrl = SpotifyService.getLoginURL(uid, {});
        params.authReqeustMessage = getAuthRequestMessage(uid);
    }
    res.render('signin', { uid, params, alert: {} });
}

export default { controller };
