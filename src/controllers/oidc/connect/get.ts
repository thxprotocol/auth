import { Request, Response } from 'express';
import { oidc } from '../../../util/oidc';
import { ChannelType } from '../../../models/Reward';
import { AccountService } from '../../../services/AccountService';
import { SpotifyService } from '../../../services/SpotifyService';
import { TwitterService } from '../../../services/TwitterService';
import { YouTubeService } from '../../../services/YouTubeService';

async function controller(req: Request, res: Response) {
    const { uid, params, session } = req.interaction;

    const account = await AccountService.get(session.accountId);
    let redirect = '';

    if (params.channel == ChannelType.Google && !account.googleAccessToken) {
        redirect = YouTubeService.getLoginUrl(req.params.uid, YouTubeService.getReadOnlyScope());
    } else if (params.channel == ChannelType.Twitter && !account.twitterAccessToken) {
        redirect = TwitterService.getLoginURL(uid);
    } else if (params.channel == ChannelType.Spotify && !account.spotifyAccessToken) {
        redirect = SpotifyService.getSpotifyUrl(uid);
    }

    if (!redirect) {
        await oidc.interactionResult(req, res, {}, { mergeWithLastSubmission: true });
        redirect = params.return_url;
    }

    return res.redirect(redirect);
}

export default { controller };
