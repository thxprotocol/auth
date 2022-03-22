import { Request, Response } from 'express';
import { oidc } from '../../../util/oidc';
import { WALLET_URL } from '../../../util/secrets';
import { SpotifyService } from '../../../services/SpotifyService';
import { TwitterService } from '../../../services/TwitterService';
import { YouTubeService } from '../../../services/YouTubeService';

async function controller(req: Request, res: Response) {
    const interaction = await oidc.interactionDetails(req, res);
    if (!interaction) throw new Error('Could not find the interaction.');
    const { uid, params } = interaction;

    if (params.return_url === WALLET_URL) {
        params.googleLoginUrl = YouTubeService.getLoginUrl(req.params.uid, YouTubeService.getReadOnlyScope());
        params.twitterLoginUrl = TwitterService.getLoginURL(uid);
        params.spotifyLoginUrl = SpotifyService.getSpotifyUrl(uid);
    }

    res.render('signin', { uid, params, alert: {} });
}

export default { controller };
