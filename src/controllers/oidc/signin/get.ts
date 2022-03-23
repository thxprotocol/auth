import { Request, Response } from '../../../types/request';
import { WALLET_URL } from '../../../util/secrets';
import { SpotifyService } from '../../../services/SpotifyService';
import { TwitterService } from '../../../services/TwitterService';
import { YouTubeService } from '../../../services/YouTubeService';

async function controller(req: Request, res: Response) {
    const { uid, params } = req.interaction;

    if (params.return_url === WALLET_URL) {
        params.googleLoginUrl = YouTubeService.getLoginUrl(req.params.uid, YouTubeService.getReadOnlyScope());
        params.twitterLoginUrl = TwitterService.getLoginURL(uid);
        params.spotifyLoginUrl = SpotifyService.getSpotifyUrl(uid);
    }

    res.render('signin', { uid, params, alert: {} });
}

export default { controller };
