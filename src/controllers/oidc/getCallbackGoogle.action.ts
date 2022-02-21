import AccountService from '../../services/AccountService';
import { Request, Response, NextFunction } from 'express';
import { getGoogleTokens } from '../../util/google';
import { HttpError } from '../../models/Error';
import { oidc } from '.';
import { parseJwt } from '../../util/jwt';
import { AccountDocument } from '../../models/Account';
import { ERROR_NO_ACCOUNT } from '../../util/messages';
import { validateEmail } from '../../util/validate';

export default async function getGoogleCallback(req: Request, res: Response, next: NextFunction) {
    async function isEmailDuplicate(email: string) {
        const result = await AccountService.isEmailDuplicate(email);

        return result;
    }

    async function getAccountBySub(sub: string) {
        const account = await AccountService.get(sub);
        if (!account) throw new Error(ERROR_NO_ACCOUNT);
        return account;
    }

    async function getAccountByEmail(email: string) {
        let account;

        if (await isEmailDuplicate(email)) {
            account = await AccountService.getByEmail(email);
        } else if (validateEmail(email)) {
            const result = await AccountService.signup(email, '', true, true, true);
            account = result.account;
        }

        return account;
    }

    async function updateTokens(account: AccountDocument, tokens: any) {
        account.googleAccessToken = tokens.access_token || account.googleAccessToken;
        account.googleRefreshToken = tokens.refresh_token || account.googleRefreshToken;
        account.googleAccessTokenExpires = Number(tokens.expiry_date) || account.googleAccessTokenExpires;

        await account.save();
    }

    async function saveInteraction(interaction: any, sub: string) {
        interaction.result = { login: { account: sub } };
        // TODO Look into why this is suggested:
        await interaction.save(interaction.exp - Math.floor(new Date().getTime() / 1000));
        return interaction.returnTo;
    }

    async function getInteraction(uid: string) {
        return await oidc.Interaction.find(uid);
    }

    try {
        const code = req.query.code as string;
        const uid = req.query.state as string;

        // Get the interaction based on the state
        const interaction = await getInteraction(uid);

        if (!interaction)
            return res.render('error', {
                params: {},
                alert: { variant: 'danger', message: 'Could not find your session.' },
            });
        if (!code) return res.redirect(interaction.params.return_url);

        // Get all token information
        const tokens = await getGoogleTokens(code);
        const claims = await parseJwt(tokens.id_token);

        // Check if there is an active session for this interaction
        const account =
            interaction.session && interaction.session.accountId
                ? // If so, get account for sub
                  await getAccountBySub(interaction.session.accountId)
                : // If not, get account for email claim
                  await getAccountByEmail(claims.email);

        const returnTo = await saveInteraction(interaction, account._id.toString());

        await updateTokens(account, tokens);

        return res.redirect(returnTo);
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }
}
