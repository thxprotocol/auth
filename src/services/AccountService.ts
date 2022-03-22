import newrelic from 'newrelic';
import Airtable from 'airtable';
import { Account, AccountDocument, IAccountUpdates } from '../models/Account';
import { createRandomToken } from '../util/tokens';
import { decryptString } from '../util/decrypt';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, SECURE_KEY } from '../util/secrets';
import { checkPasswordStrength } from '../util/passwordcheck';
import Web3 from 'web3';
import {
    ERROR_NO_ACCOUNT,
    DURATION_TWENTYFOUR_HOURS,
    ERROR_SIGNUP_TOKEN_INVALID,
    ERROR_SIGNUP_TOKEN_EXPIRED,
    SUCCESS_SIGNUP_COMPLETED,
    ERROR_AUTHENTICATION_TOKEN_INVALID_OR_EXPIRED,
    ERROR_PASSWORD_NOT_MATCHING,
    ERROR_PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED,
    ERROR_PASSWORD_STRENGTH,
} from '../util/messages';
import { YouTubeService } from './YouTubeService';
import { logger } from '../util/logger';

export class AccountService {
    static get(sub: string) {
        return Account.findById(sub);
    }

    static getByEmail(email: string) {
        return Account.findOne({ email });
    }

    static getByAddress(address: string) {
        return Account.findOne({ address });
    }

    static async isActiveUserByEmail(email: string) {
        const result = await Account.findOne({ email, active: true });
        return Boolean(result);
    }

    static async update(
        account: AccountDocument,
        {
            acceptTermsPrivacy,
            acceptUpdates,
            address,
            privateKey,
            googleAccess,
            twitterAccess,
            spotifyAccess,
            authenticationToken,
            authenticationTokenExpires,
            organisation,
            firstName,
            lastName,
            plan,
            type,
        }: IAccountUpdates,
    ) {
        // No strict checking here since null == undefined
        if (account.acceptTermsPrivacy == null) {
            account.acceptTermsPrivacy = acceptTermsPrivacy == null ? false : account.acceptTermsPrivacy;
        } else {
            account.acceptTermsPrivacy = acceptTermsPrivacy || account.acceptTermsPrivacy;
        }

        if (organisation) {
            account.organisation = organisation;
        }

        if (firstName) {
            account.firstName = firstName;
        }

        if (lastName) {
            account.lastName = lastName;
        }

        if (plan) {
            account.plan = plan;
        }

        if (type) {
            account.type = type;
        }

        // No strict checking here since null == undefined
        if (account.acceptUpdates == null) {
            account.acceptUpdates = acceptUpdates == null ? false : account.acceptUpdates;
        } else {
            account.acceptUpdates = acceptUpdates || account.acceptTermsPrivacy;
        }

        account.authenticationToken = authenticationToken || account.authenticationToken;
        account.authenticationTokenExpires = authenticationTokenExpires || account.authenticationTokenExpires;
        account.address = address || account.address;
        account.privateKey = privateKey || account.privateKey;

        if (googleAccess === false) {
            try {
                await YouTubeService.revokeAccess(account);
            } catch (error) {
                newrelic.noticeError(error);
                logger.error('Unable to revoke YouTube access', error);
            }
            account.googleAccessToken = '';
            account.googleRefreshToken = '';
            account.googleAccessTokenExpires = null;
        }

        if (twitterAccess === false) {
            account.twitterAccessToken = '';
            account.twitterRefreshToken = '';
            account.twitterAccessTokenExpires = null;
        }

        if (spotifyAccess === false) {
            account.spotifyAccessToken = '';
            account.spotifyRefreshToken = '';
            account.spotifyAccessTokenExpires = null;
        }

        return await account.save();
    }

    static async signup(
        email: string,
        password: string,
        acceptTermsPrivacy: boolean,
        acceptUpdates: boolean,
        active = false,
    ) {
        let account = await Account.findOne({ email, active: false });

        if (!account) {
            account = new Account();
        }

        account.active = active;
        account.email = email;
        account.password = password;
        account.acceptTermsPrivacy = acceptTermsPrivacy || false;
        account.acceptUpdates = acceptUpdates || false;

        if (!active) {
            account.signupToken = createRandomToken();
            account.signupTokenExpires = DURATION_TWENTYFOUR_HOURS;
        }

        if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
            const date = new Date(account.createdAt);
            const base = new Airtable().base(AIRTABLE_BASE_ID);
            await base('Pipeline: Signups').create({
                Email: account.email,
                Date: date.getMonth() + '/' + (date.getDay() + 1) + '/' + date.getFullYear(),
            });
        }

        return account;
    }

    static async signupFor(email: string, password: string, address?: string) {
        const wallet = new Web3().eth.accounts.create();
        const privateKey = address ? null : wallet.privateKey;
        const account = new Account({
            active: true,
            address: address ? address : wallet.address,
            privateKey: address ? privateKey : wallet.privateKey,
            email,
            password,
        });

        await account.save();
        return account;
    }

    static async verifySignupToken(signupToken: string) {
        const account = await Account.findOne({ signupToken });

        if (!account) {
            return { error: ERROR_SIGNUP_TOKEN_INVALID };
        }

        if (account.signupTokenExpires < Date.now()) {
            return { error: ERROR_SIGNUP_TOKEN_EXPIRED };
        }

        account.signupToken = '';
        account.signupTokenExpires = null;
        account.active = true;

        await account.save();

        return { result: SUCCESS_SIGNUP_COMPLETED };
    }

    static async getSubForAuthenticationToken(
        password: string,
        passwordConfirm: string,
        authenticationToken: string,
        secureKey: string,
    ) {
        const account: AccountDocument = await Account.findOne({ authenticationToken })
            .where('authenticationTokenExpires')
            .gt(Date.now())
            .exec();

        if (!account) {
            throw new Error(ERROR_AUTHENTICATION_TOKEN_INVALID_OR_EXPIRED);
        }

        if (password !== passwordConfirm) {
            throw new Error(ERROR_PASSWORD_NOT_MATCHING);
        }

        const oldPassword = decryptString(secureKey, SECURE_KEY.split(',')[0]);

        account.privateKey = decryptString(account.privateKey, oldPassword);
        account.password = password;

        await account.save();

        return account._id.toString();
    }

    static async getSubForCredentials(email: string, password: string) {
        const account: AccountDocument = await Account.findOne({ email });

        if (!account) throw new Error(ERROR_NO_ACCOUNT);

        if (!account.comparePassword(password)) {
            throw new Error(ERROR_PASSWORD_NOT_MATCHING);
        }

        return account._id.toString();
    }

    static async getSubForPasswordResetToken(password: string, passwordConfirm: string, passwordResetToken: string) {
        const account: AccountDocument = await Account.findOne({ passwordResetToken })
            .where('passwordResetExpires')
            .gt(Date.now())
            .exec();
        const passwordStrength = checkPasswordStrength(password);
        if (!account) {
            throw new Error(ERROR_PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED);
        }
        if (passwordStrength != 'strong') {
            throw new Error(ERROR_PASSWORD_STRENGTH);
        }
        if (password !== passwordConfirm) {
            throw new Error(ERROR_PASSWORD_NOT_MATCHING);
        }
        account.password = password;

        await account.save();

        return account._id.toString();
    }

    static remove(id: string) {
        Account.remove({ _id: id });
    }

    static async post(
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        signupToken: string,
        signupTokenExpires: number,
    ) {
        try {
            const account = new Account({
                firstName,
                lastName,
                email,
                password,
                signupToken,
                signupTokenExpires,
            });

            await account.save();
        } catch (error) {
            return { error };
        }
    }

    static async count() {
        try {
            return await Account.countDocuments();
        } catch (error) {
            return { error };
        }
    }
}
