import AccountService from '../../services/AccountService';
import { Response, NextFunction } from 'express';
import { getGoogleAccessToken } from '../../util/google';
import { HttpError, HttpRequest } from '../../models/Error';
import { oidc } from '.';
import { parseJwt } from '../../util/jwt';

export const getGoogle = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const code = req.query.code as string;
        const state = req.query.state as string;
        const interaction = await oidc.Interaction.find(state);
        const tokens = await getGoogleAccessToken(code);
        const claims = await parseJwt(tokens.id_token);
        const { account, error } = await AccountService.getByEmail(claims.email);
        const sub = account._id.toString();

        account.googleAccessToken = tokens.access_token;
        account.googleAccessTokenExpires = Number(tokens.expiry_date); // TODO incorrect property
        account.save();

        interaction.result = { login: { account: sub } };

        await interaction.save(interaction.exp - Math.floor(new Date().getTime() / 1000));

        res.redirect(interaction.returnTo);
    } catch (e) {
        next(new HttpError(502, 'Could not process your Google access token', e));
    }
};
