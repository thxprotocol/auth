import { Request, Response } from '../../types/request';
import { oidc } from '../../util/oidc';

async function controller(req: Request, res: Response) {
    const { uid, prompt, params } = req.interaction;

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
}

export default { controller };