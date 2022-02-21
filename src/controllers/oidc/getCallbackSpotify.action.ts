import { Request, Response, NextFunction } from 'express';
import { AccountDocument } from '../../models/Account';
import SpotifyService from '../../services/SpotifyService';
import AccountService from '../../services/AccountService';
import { ERROR_NO_ACCOUNT } from '../../util/messages';
import { validateEmail } from '../../util/validate';
import { oidc } from '.';
import { HttpError } from '../../models/Error';

async function getAccountByEmail(email: string): Promise<AccountDocument> {
    let account;

    if (await AccountService.isEmailDuplicate(email)) {
        account = await AccountService.getByEmail(email);
    } else if (validateEmail(email)) {
        const result = await AccountService.signup(email, '', true, true, true);
        account = result.account;
    }

    return account;
}

async function updateTokens(account: AccountDocument, tokens: any): Promise<AccountDocument> {
    account.spotifyAccessToken = tokens.access_token || account.spotifyAccessToken;
    account.spotifyRefreshToken = tokens.refresh_token || account.spotifyRefreshToken;
    account.spotifyAccessTokenExpires =
        Date.now() + Number(tokens.expires_in) * 1000 || account.spotifyAccessTokenExpires;

    return await account.save();
}

async function getAccountBySub(sub: string): Promise<AccountDocument> {
    const account = await AccountService.get(sub);
    if (!account) throw new Error(ERROR_NO_ACCOUNT);
    return account;
}

async function saveInteraction(interaction: any, sub: string) {
    interaction.result = { login: { account: sub } };
    // TODO Look into why this is suggested:
    await interaction.save(interaction.exp - Math.floor(new Date().getTime() / 1000));
    return interaction.returnTo;
}

async function getInteraction(uid: string) {
    const interaction = await oidc.Interaction.find(uid);
    if (!interaction) throw new Error('Could not find interaction for this state');
    return interaction;
}

async function getTokens(code: string) {
    const { tokens, error } = await SpotifyService.requestTokens(code);
    if (error) throw new Error('Could not get Spotify tokens');
    return tokens;
}

async function getSpotifyUser(accessToken: string) {
    const user = await SpotifyService.getUser(accessToken);
    if (!user) throw new Error('No Spotify user returned for access token');
    return user;
}

export default async function getSpotifyCallback(req: Request, res: Response, next: NextFunction) {
    try {
        const code = req.query.code as string;
        const uid = req.query.state as string;
        const error = req.query.error as string;
        if (error) return res.redirect(`/oidc/${uid}`);

        // Get all token information
        const tokens = await getTokens(code);
        const user = await getSpotifyUser(tokens.access_token);
        const email = user.id + '@spotify.thx.network';

        // Get the interaction based on the state
        const interaction = await getInteraction(uid);

        // Check if there is an active session for this interaction
        const account =
            interaction.session && interaction.session.accountId
                ? // If so, get account for sub
                  await getAccountBySub(interaction.session.accountId)
                : // If not, get account for email claim
                  await getAccountByEmail(email);

        const returnTo = await saveInteraction(interaction, account._id.toString());

        await updateTokens(account, tokens);

        return res.redirect(returnTo);
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }
}
