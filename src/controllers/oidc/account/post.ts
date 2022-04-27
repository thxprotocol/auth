import { Request, Response } from 'express';
import { body } from 'express-validator';
import { AccountService } from '../../../services/AccountService';
import { ERROR_NO_ACCOUNT } from '../../../util/messages';

export const validation = [
    body('googleAccess').optional().isString(),
    body('twitterAccess').optional().isString(),
    body('spotifyAccess').optional().isString(),
    body('firstName').optional().isString().isLength({ min: 0, max: 50 }),
    body('lastName').optional().isString().isLength({ min: 0, max: 50 }),
    body('organisation').optional().isString().isLength({ min: 0, max: 50 }),
    body().customSanitizer((val) => {
        return {
            googleAccess: val.googleAccess === 'false' ? false : undefined,
            twitterAccess: val.twitterAccess === 'false' ? false : undefined,
            spotifyAccess: val.spotifyAccess === 'false' ? false : undefined,
            firstName: val.firstName,
            lastName: val.lastName,
            organisation: val.organisation,
        };
    }),
];

export async function controller(req: Request, res: Response) {
    const { uid, session } = req.interaction;
    const account = await AccountService.get(session.accountId);
    if (!account) throw new Error(ERROR_NO_ACCOUNT);
    await AccountService.update(account, req.body);

    return res.redirect(`/oidc/${uid}/account`);
}

export default { validation, controller };
