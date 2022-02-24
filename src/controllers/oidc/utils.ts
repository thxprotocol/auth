import { AccountService } from '../../services/AccountService';
import { validateEmail } from '../../util/validate';
import { oidc } from '.';

export async function getAccountByEmail(email: string) {
    let account;

    account = await AccountService.getByEmail(email);

    if (!account.active && validateEmail(email)) {
        account = await AccountService.signup(email, '', true, true, true);
    }

    return account;
}

export async function saveInteraction(interaction: any, sub: string) {
    interaction.result = { login: { account: sub } };
    // TODO Look into why this is suggested:
    await interaction.save(interaction.exp - Math.floor(new Date().getTime() / 1000));
    return interaction.returnTo;
}

export async function getInteraction(uid: string) {
    const interaction = await oidc.Interaction.find(uid);
    if (!interaction) throw new Error('Could not find interaction for this state');
    return interaction;
}
