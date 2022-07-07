import { Request, Response } from 'express';
import { oidc } from '../../util/oidc';

async function controller(req: Request, res: Response) {
    const { uid, prompt, params } = req.interaction;
    console.log('SONO IN QUESTO CONTROLLER', { uid, prompt, params });
    // Prompt params are used for unauthenticated routes
    switch (params.prompt) {
        case 'create': {
            return res.redirect(`/oidc/${uid}/signup?returnUrl=${params.return_url}`);
        }
        case 'confirm': {
            return res.redirect(`/oidc/${uid}/confirm`);
        }
        case 'reset': {
            return res.redirect(`/oidc/${uid}/reset`);
        }
        // TODO Make this a regular prompt since it only applies to authenticated routes
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
            console.log('AUTH LOGIN');
            if (params.reward_hash) {
                return res.redirect(`/oidc/${uid}/claim`);
            } else {
                return res.redirect(`/oidc/${uid}/signin`);
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
}

export default { controller };
