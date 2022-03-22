import { Request, Response } from 'express';
import { ChannelType } from '../../models/Reward';
import { AccountService } from '../../services/AccountService';
import { SpotifyService } from '../../services/SpotifyService';
import { TwitterService } from '../../services/TwitterService';
import { YouTubeService } from '../../services/YouTubeService';
import { oidc } from '../../util/oidc';

export default async function getController(req: Request, res: Response) {
    try {
        const interaction = await oidc.interactionDetails(req, res);
        if (!interaction) throw new Error('Could not find the interaction.');

        const { uid, prompt, params } = interaction;

        // Prompt params are used for unauthenticated routes
        switch (params.prompt) {
            case 'create': {
                return res.redirect(`/oidc/${uid}/signup`);
            }
            case 'confirm': {
                return res.redirect(`/oidc/${uid}/confirm`);
            }
            case 'reset': {
                return res.redirect(`/oidc/${uid}/reset`);
            }
            case 'account-settings': {
                return res.redirect(`/oidc/${uid}/account`);
            }
        }
        // Regular prompts are used for authenticated routes
        switch (prompt.name) {
            case 'connect': {
                return res.redirect(`/oidc/${uid}/connect`);
            }
            case 'login': {
                if (!params.reward_hash) {
                    return res.redirect(`/oidc/${uid}/signin`);
                } else {
                    return res.redirect(`/oidc/${uid}/claim`);
                }
            }
            case 'consent': {
                const consent: any = {};
                consent.rejectedScopes = [];
                consent.rejectedClaims = [];
                consent.replace = false;

                return await oidc.interactionFinished(req, res, { consent }, { mergeWithLastSubmission: true });
            }
        }
    } catch (error) {
        return res.render('error', { params: {}, alert: { variant: 'danger', message: error.message } });
    }
}
