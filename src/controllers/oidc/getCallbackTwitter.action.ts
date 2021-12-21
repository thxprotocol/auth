// import AccountService from '../../services/AccountService';
import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
// import { oidc } from '.';
// import { parseJwt } from '../../util/jwt';
// import { AccountDocument } from '../../models/Account';
// import { ERROR_NO_ACCOUNT } from '../../util/messages';
// import { validateEmail } from '../../util/validate';
import { getTwitterTokens } from '../../util/twitter';

export default async function getTwitterCallback(req: HttpRequest, res: Response, next: NextFunction) {
    // async function isEmailDuplicate(email: string) {
    //     const { result, error } = await AccountService.isEmailDuplicate(email);

    //     if (error) {
    //         throw new Error(error.message);
    //     }

    //     return result;
    // }

    // async function getAccountBySub(sub: string) {
    //     const { account } = await AccountService.get(sub);
    //     if (!account) throw new Error(ERROR_NO_ACCOUNT);
    //     return account;
    // }

    // async function getAccountByEmail(email: string) {
    //     let account;

    //     if (await isEmailDuplicate(email)) {
    //         const result = await AccountService.getByEmail(email);
    //         account = result.account;
    //     } else if (validateEmail(email)) {
    //         const result = await AccountService.signup(email, '', true, true, true);
    //         account = result.account;
    //     }

    //     return account;
    // }

    // async function updateTokens(account: AccountDocument, tokens: any) {
    //     account.twitterAccessToken = tokens.access_token || account.googleAccessToken;
    //     account.twitterRefreshToken = tokens.refresh_token || account.googleRefreshToken;
    //     account.twitterAccessTokenExpires = Number(tokens.expiry_date) || account.googleAccessTokenExpires;

    //     await account.save();
    // }

    // async function saveInteraction(interaction: any, sub: string) {
    //     interaction.result = { login: { account: sub } };
    //     // TODO Look into why this is suggested:
    //     await interaction.save(interaction.exp - Math.floor(new Date().getTime() / 1000));
    //     return interaction.returnTo;
    // }

    // async function getInteraction(uid: string) {
    //     const interaction = await oidc.Interaction.find(uid);
    //     if (!interaction) throw new Error('Could not find interaction for this state');
    //     return interaction;
    // }

    try {
        const code = req.query.code as string;
        const uid = req.query.state as string;

        // Get all token information
        const { tokens, error } = await getTwitterTokens(code);
        console.log(uid, tokens, error);
        // const claims = await parseJwt(tokens.id_token);

        // // Get the interaction based on the state
        // const interaction = await getInteraction(uid);

        // // Check if there is an active session for this interaction
        // const account =
        //     interaction.session && interaction.session.accountId
        //         ? // If so, get account for sub
        //           await getAccountBySub(interaction.session.accountId)
        //         : // If not, get account for email claim
        //           await getAccountByEmail(claims.email);

        // const returnTo = await saveInteraction(interaction, account._id.toString());

        // await updateTokens(account, tokens);

        // return res.redirect(returnTo);
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }
}
