import { AccountService } from '../../../../services/AccountService';
import { Request, Response } from 'express';
import { oidc } from '../../../../util/oidc';
import { parseJwt } from '../../../../util/jwt';
import { AccountDocument } from '../../../../models/Account';
import { getAccountByEmail, saveInteraction } from '../../../../util/oidc';
import { YouTubeService } from '../../../../services/YouTubeService';

export async function ReadCallbackGoogle(req: Request, res: Response) {
    async function updateTokens(account: AccountDocument, tokens: any) {
        account.googleAccessToken = tokens.access_token || account.googleAccessToken;
        account.googleRefreshToken = tokens.refresh_token || account.googleRefreshToken;
        account.googleAccessTokenExpires = Number(tokens.expiry_date) || account.googleAccessTokenExpires;

        await account.save();
    }

    const code = req.query.code as string;
    const uid = req.query.state as string;

    // Get the interaction based on the state
    const interaction = await await oidc.Interaction.find(uid);

    if (!interaction)
        return res.render('error', {
            params: {},
            alert: { variant: 'danger', message: 'Could not find your session.' },
        });
    if (!code) return res.redirect(interaction.params.return_url);

    // Get all token information
    const tokens = await YouTubeService.getTokens(code);
    const claims = await parseJwt(tokens.id_token);

    // Check if there is an active session for this interaction
    const account =
        interaction.session && interaction.session.accountId
            ? // If so, get account for sub
              await AccountService.get(interaction.session.accountId)
            : // If not, get account for email claim
              await getAccountByEmail(claims.email);

    const returnTo = await saveInteraction(interaction, account._id.toString());

    await updateTokens(account, tokens);

    return res.redirect(returnTo);
}
