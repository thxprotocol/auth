import { Request, Response } from 'express';
import { AUTH_URL, WALLET_URL } from '../../../util/secrets';
import { SpotifyService } from '../../../services/SpotifyService';
import { TwitterService } from '../../../services/TwitterService';
import { YouTubeService } from '../../../services/YouTubeService';
import { createTypedMessage } from '../../../util/typedMessage';

async function controller(req: Request, res: Response) {
    const { uid, params } = req.interaction;
    params.googleLoginUrl = YouTubeService.getLoginUrl(req.params.uid, YouTubeService.getBasicScopes());

    if (params.return_url === WALLET_URL) {
        params.twitterLoginUrl = TwitterService.getLoginURL(uid, {});
        params.spotifyLoginUrl = SpotifyService.getLoginURL(uid, {});
        params.authRequestMessage = createTypedMessage(
            "Welcome! Please make sure you have selected your preferred account and sign this message to verify it's ownership.",
            AUTH_URL,
            uid,
        );
    }
    res.render('signin', { uid, params, alert: {} });
}

export default { controller };
