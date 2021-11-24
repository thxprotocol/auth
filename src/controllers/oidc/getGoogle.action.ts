import AccountService from '../../services/AccountService';
import { Response, NextFunction } from 'express';
import { getGoogleAccessToken } from '../../util/google';
import { HttpError, HttpRequest } from '../../models/Error';
import { oidc } from '.';
import { parseJwt } from '../../util/jwt';

export const getGoogle = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getSub() {
        let account;
        const code = req.query.code as string;
        const tokens = await getGoogleAccessToken(code);
        const claims = await parseJwt(tokens.id_token);
        const { result, error } = await AccountService.isEmailDuplicate(claims.email);

        if (error) {
            throw new Error(error.message);
        }

        if (!result) {
            account = await AccountService.signup(claims.email, '', true, true, true);
        } else {
            const result = await AccountService.getByEmail(claims.email);
            account = result.account;
        }
        const sub = account._id.toString();

        account.googleAccessToken = tokens.access_token;
        account.googleAccessTokenExpires = Number(tokens.expiry_date);

        await account.save();

        return sub;
    }

    async function saveInteraction(sub: string) {
        const state = req.query.state as string;
        const interaction = await oidc.Interaction.find(state);

        interaction.result = { login: { account: sub } };

        await interaction.save(interaction.exp - Math.floor(new Date().getTime() / 1000));

        return interaction.returnTo;
    }

    try {
        const sub = await getSub();
        const returnTo = await saveInteraction(sub);

        res.redirect(returnTo);
    } catch (e) {
        next(new HttpError(502, 'Could not process your Google access token', e));
    }
};
