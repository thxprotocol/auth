import { Request, Response } from 'express';
import { SpotifyService } from '../../../services/SpotifyService';
import { TwitterService } from '../../../services/TwitterService';
import { YouTubeService } from '../../../services/YouTubeService';
import { AccountService } from '../../../services/AccountService';

async function controller(req: Request, res: Response) {
    const { uid, params, alert, session } = req.interaction;
    const account = await AccountService.get(session.accountId);

    params.googleLoginUrl = YouTubeService.getLoginUrl(req.params.uid, { scope: YouTubeService.getReadOnlyScope() });
    params.twitterLoginUrl = TwitterService.getLoginURL(uid, {});
    params.spotifyLoginUrl = SpotifyService.getLoginURL(uid, {});

    return res.render('account', {
        uid,
        alert,
        params: {
            ...params,
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
            organisation: account.organisation,
            address: account.address,
            plan: account.plan,
            otpSecret: account.otpSecret,
        },
    });
}

export default { controller };
