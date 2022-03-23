import { Request, Response } from '../../../types/request';
import { body } from 'express-validator';
import { AccountService } from '../../../services/AccountService';
import { ERROR_NO_ACCOUNT } from '../../../util/messages';

export const validation = [
    body('firstName').optional().isString().isLength({ min: 0, max: 50 }),
    body('lastName').optional().isString().isLength({ min: 0, max: 50 }),
    body('organisation').optional().isString().isLength({ min: 0, max: 50 }),
    body().customSanitizer((val) => {
        return {
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

    await account.updateOne(req.body);

    return res.redirect(`/oidc/${uid}/account`);
}

export default { validation, controller };
