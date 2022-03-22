import Provider from 'oidc-provider';
import configuration from '../config/oidc';
import { NODE_ENV, ISSUER, SECURE_KEY } from './secrets';
import { AccountService } from '../services/AccountService';
import { validateEmail } from './validate';

const oidc = new Provider(ISSUER, configuration as any); // Configuration

oidc.proxy = true;
oidc.keys = SECURE_KEY.split(',');

if (NODE_ENV !== 'production') {
    const { invalidate: orig } = (oidc.Client as any).Schema.prototype;
    (oidc.Client as any).Schema.prototype.invalidate = function invalidate(message: any, code: any) {
        if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') return;
        orig.call(this, message);
    };
}

async function getAccountByEmail(email: string) {
    let account;

    account = await AccountService.getByEmail(email);

    if ((!account || (account && !account.active)) && validateEmail(email)) {
        account = await AccountService.signup(email, '', true, true, true);
    }

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

export { oidc, getAccountByEmail, saveInteraction, getInteraction };
