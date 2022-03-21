import { Request, Response } from 'express';
import { authenticator } from 'otplib';
import { AccountService } from '../../services/AccountService';
import { ERROR_NO_ACCOUNT } from '../../util/messages';
import { getInteraction } from './utils';

const postUpdate = async (req: Request, res: Response) => {
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
    const type = req.body.type;

    if (error) return res.redirect(`/oidc/${uid}`);

    // Get all token information
    const interaction = await getInteraction(uid);

    if (!interaction.session) {
        throw new Error('You have to login before do this action.');
    }

    const account = await getAccountBySub(interaction.session.accountId);

    await AccountService.update(account, { firstName, lastName, organisation, plan, type });

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
            type: account.type,
            mfaEnable: account.otpSecret,
        },
    });
};

export default postUpdate;
