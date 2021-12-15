import { Account, AccountDocument, IAccountUpdates } from '../models/Account';
import { createRandomToken } from '../util/tokens';
import { decryptString } from '../util/decrypt';
import { SECURE_KEY } from '../util/secrets';
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
    ERROR_PASSWORD_MATCHING,
    ERROR_PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED,
    ERROR_PASSWORD_STRENGTH,
} from '../util/messages';

export default class AccountService {
    static async get(sub: string) {
        try {
            const account = await Account.findById(sub);

            return { account };
        } catch (error) {
            return { error };
        }
    }

    static async getByEmail(email: string) {
        try {
            const account = await Account.findOne({ email });

            if (!account) {
                throw new Error(ERROR_NO_ACCOUNT);
            }

            return { account };
        } catch (error) {
            return { error };
        }
    }

    static async getByAddress(address: string) {
        try {
            const account = await Account.findOne({ address });

            if (!account) {
                throw new Error(ERROR_NO_ACCOUNT);
            }

            return { account };
        } catch (error) {
            return { error };
        }
    }

    static async isEmailDuplicate(email: string) {
        try {
            const result = await Account.findOne({ email, active: true });
            return { result };
        } catch (error) {
            return { error };
        }
    }

    static async update(
        account: AccountDocument,
        { acceptTermsPrivacy, acceptUpdates, address, privateKey, googleAccess }: IAccountUpdates,
    ) {
        try {
            // No strict checking here since null == undefined
            if (account.acceptTermsPrivacy == null) {
                account.acceptTermsPrivacy = acceptTermsPrivacy == null ? false : account.acceptTermsPrivacy;
            } else {
                account.acceptTermsPrivacy = acceptTermsPrivacy || account.acceptTermsPrivacy;
            }

            // No strict checking here since null == undefined
            if (account.acceptUpdates == null) {
                account.acceptUpdates = acceptUpdates == null ? false : account.acceptUpdates;
            } else {
                account.acceptUpdates = acceptUpdates || account.acceptTermsPrivacy;
            }

            account.address = address || account.address;
            account.privateKey = privateKey || account.privateKey;

            // TODO Should also remove googleAccessToken and refresh token here

            return { result: await account.save() };
        } catch (error) {
            return { error };
        }
    }

    static async signup(
        email: string,
        password: string,
        acceptTermsPrivacy: boolean,
        acceptUpdates: boolean,
        sso = false,
    ) {
        try {
            let account = await Account.findOne({ email, active: false });

            if (!account) {
                account = new Account({
                    active: false,
                });
            }

            account.email = email;
            account.password = password;
            account.acceptTermsPrivacy = acceptTermsPrivacy || false;
            account.acceptUpdates = acceptUpdates || false;

            if (!sso) {
                account.signupToken = createRandomToken();
                account.signupTokenExpires = DURATION_TWENTYFOUR_HOURS;
            }

            return { account };
        } catch (error) {
            return { error };
        }
    }

    static async signupFor(email: string, secret: string, address?: string) {
        try {
            const wallet = new Web3().eth.accounts.create();
            const privateKey = address ? null : wallet.privateKey;
            const account = new Account({
                active: true,
                address: address ? address : wallet.address,
                privateKey: address ? privateKey : wallet.privateKey,
                email,
                secret,
            });

            return { account: await account.save() };
        } catch (error) {
            return { error };
        }
    }

    static async verifySignupToken(signupToken: string) {
        try {
            const account = await Account.findOne({ signupToken });

            if (!account) {
                throw new Error(ERROR_SIGNUP_TOKEN_INVALID);
            }

            if (account.signupTokenExpires < Date.now()) {
                throw new Error(ERROR_SIGNUP_TOKEN_EXPIRED);
            }

            account.signupToken = '';
            account.signupTokenExpires = null;
            account.active = true;

            await account.save();

            return {
                result: SUCCESS_SIGNUP_COMPLETED,
            };
        } catch (error) {
            return { error };
        }
    }

    static async getSubForAuthenticationToken(
        password: string,
        passwordConfirm: string,
        authenticationToken: string,
        secureKey: string,
    ) {
        try {
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

            return { sub: account._id.toString() };
        } catch (error) {
            return { error };
        }
    }

    static async getSubForCredentials(email: string, password: string) {
        try {
            const account: AccountDocument = await Account.findOne({ email });

            const { error, isMatch } = account.comparePassword(password);

            if (error) {
                throw new Error(ERROR_PASSWORD_MATCHING);
            }

            if (!isMatch) {
                throw new Error(ERROR_PASSWORD_NOT_MATCHING);
            }

            return { sub: account._id.toString() };
        } catch (error) {
            return { error };
        }
    }

    static async getSubForPasswordResetToken(password: string, passwordConfirm: string, passwordResetToken: string) {
        try {
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

            return { sub: account._id.toString() };
        } catch (error) {
            return { error };
        }
    }

    static async remove(id: string) {
        try {
            await Account.remove({ _id: id });
        } catch (error) {
            return { error };
        }
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
