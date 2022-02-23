import AccountService from '../../services/AccountService';
import TwitterService from '../../services/TwitterService';
import { oidc } from '.';
import { Request, Response } from 'express';
import { AccountDocument } from '../../models/Account';
import { ERROR_NO_ACCOUNT } from '../../util/messages';
import { validateEmail } from '../../util/validate';

export default async function getTwitterCallback(req: Request, res: Response) {
    async function getAccountBySub(sub: string) {
        const account = await AccountService.get(sub);
        if (!account) throw new Error(ERROR_NO_ACCOUNT);
        return account;
    }

    async function getAccountByEmail(email: string) {
        let account;

        if (await AccountService.isEmailDuplicate(email)) {
            account = await AccountService.getByEmail(email);
        } else if (validateEmail(email)) {
            account = await AccountService.signup(email, '', true, true, true);
        }

        return account;
    }

    async function updateTokens(account: AccountDocument, tokens: any) {
        account.twitterAccessToken = tokens.access_token || account.twitterAccessToken;
        account.twitterRefreshToken = tokens.refresh_token || account.twitterRefreshToken;
        account.twitterAccessTokenExpires =
            Date.now() + Number(tokens.expires_in) * 1000 || account.twitterAccessTokenExpires;

        return await account.save();
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

    const code = req.query.code as string;
    const uid = req.query.state as string;
    const error = req.query.error as string;

    if (error) return res.redirect(`/oidc/${uid}`);

    // Get all token information
    const tokens = await TwitterService.requestTokens(code);
    const user = await TwitterService.getUser(tokens.access_token);
    const email = user.id + '@twitter.thx.network';

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
}
