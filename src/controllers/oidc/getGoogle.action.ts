import AccountService from '../../services/AccountService';
import { Response, NextFunction } from 'express';
import { getGoogleTokens } from '../../util/google';
import { HttpError, HttpRequest } from '../../models/Error';
import { oidc } from '.';
import { parseJwt } from '../../util/jwt';
import { AccountDocument } from '../../models/Account';

export const getGoogle = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function isEmailDuplicate(email: string) {
        const { result, error } = await AccountService.isEmailDuplicate(email);

        if (error) {
            throw new Error(error.message);
        }

        return result;
    }

    async function getAccount(interaction: any, email: string) {
        let account;

        if (interaction.session) {
            const sub = interaction.session.accountId;
            const result = await AccountService.get(sub);
            account = result.account;
        } else if (!(await isEmailDuplicate(email))) {
            const result = await AccountService.signup(email, '', true, true, true);
            account = result.account;
        } else {
            const result = await AccountService.getByEmail(email);
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
        if (interaction.session) {
            return interaction.params.return_url;
        }

        interaction.result = { login: { account: sub } };

        // TODO might also be able to just finish the interaction here for signins/ups
        await interaction.save(interaction.exp - Math.floor(new Date().getTime() / 1000));

        return interaction.returnTo;
    }

    try {
        const code = req.query.code as string;
        const state = req.query.state as string;
        const interaction = await oidc.Interaction.find(state);
        const tokens = await getGoogleTokens(code);
        const claims = await parseJwt(tokens.id_token);
        const account = await getAccount(interaction, claims.email);
        const returnTo = await saveInteraction(interaction, account._id.toString());

        await updateTokens(account, tokens);

        res.redirect(returnTo);
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};
