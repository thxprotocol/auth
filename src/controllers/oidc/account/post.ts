import { Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticator } from 'otplib';
import { AccountService } from '../../../services/AccountService';
import { ERROR_NO_ACCOUNT } from '../../../util/messages';
import { getInteraction } from '../../../util/oidc';

export const validation = [
    body('address').optional().isEthereumAddress(),
    body('email').exists().isEmail(),
    body('plan').custom((val) => {
        return ['solo', 'community', 'creator'].includes(val);
    }),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('organisation').optional().isString(),
    body().customSanitizer((values) => {
        return values;
    }),
];

export async function controller(req: Request, res: Response) {
    async function getAccountBySub(sub: string) {
        const account = await AccountService.get(sub);
        if (!account) throw new Error(ERROR_NO_ACCOUNT);
        return account;
    }

    const uid = req.body.uid as string;
    const error = req.query.error as string;

    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const organisation = req.body.organisation;
    const plan = req.body.plan;

    if (error) return res.redirect(`/oidc/${uid}`);

    // Get all token information
    const interaction = await getInteraction(uid);

    if (!interaction.session) {
        throw new Error('You have to login before do this action.');
    }

    const account = await getAccountBySub(interaction.session.accountId);

    await AccountService.update(account, { firstName, lastName, organisation, plan });

    let otpSecret = account.otpSecret;
    if (!otpSecret) {
        otpSecret = authenticator.generateSecret();
    }

    return res.render('account', {
        uid,
        params: {
            ...req.body,
            first_name: account.firstName,
            last_name: account.lastName,
            address: account.address,
            organisation: account.organisation,
            plan: account.plan,
            mfaEnable: account.otpSecret,
        },
    });
}

export default { validation, controller };
