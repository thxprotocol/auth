import { Account, AccountDocument, ERC20Token, IAccountUpdates } from '../models/Account';
import { createRandomToken } from '../util/tokens';
import { decryptString } from '../util/decrypt';
import { ISSUER, SECURE_KEY } from '../util/secrets';
import { checkPasswordStrength } from '../util/passwordcheck';
import Web3 from 'web3';
import axios from 'axios';

const DURATION_TWENTYFOUR_HOURS = Date.now() + 1000 * 60 * 60 * 24;
const ERROR_AUTHENTICATION_TOKEN_INVALID_OR_EXPIRED = 'Your authentication token is invalid or expired.';
const ERROR_PASSWORD_MATCHING = 'Could not compare your passwords';
const ERROR_PASSWORD_NOT_MATCHING = 'Your provided passwords do not match';
const ERROR_SIGNUP_TOKEN_INVALID = 'Could not find an account for this signup_token.';
const ERROR_SIGNUP_TOKEN_EXPIRED = 'This signup_token has expired.';
const SUCCESS_SIGNUP_COMPLETED = 'Congratulations! Your e-mail address has been verified.';
const ERROR_NO_ACCOUNT = 'Could not find an account for this address';
const ERROR_PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED = 'Your password reset token is invalid or expired.';
const ERROR_PASSWORD_STRENGTH = 'Please enter a strong password.';

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
        { acceptTermsPrivacy, acceptUpdates, address, memberships, privateKey, burnProofs }: IAccountUpdates,
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
            account.memberships = memberships || account.memberships;
            account.privateKey = privateKey || account.privateKey;
            account.burnProofs = burnProofs || account.burnProofs;

            await account.save();
        } catch (error) {
            return { error };
        }
    }

    static async patch(account: AccountDocument) {
        try {
            await account.save();
        } catch (error) {
            return { error };
        }
    }

    static async signup(email: string, password: string, acceptTermsPrivacy: boolean, acceptUpdates: boolean) {
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
        account.signupToken = createRandomToken();
        account.signupTokenExpires = DURATION_TWENTYFOUR_HOURS;

        return account;
    }

    static async signupFor(email: string, secret: string, poolAddress: string, address?: string) {
        try {
            const wallet = new Web3().eth.accounts.create();
            const privateKey = address ? null : wallet.privateKey;
            const account = new Account({
                active: true,
                address: address ? address : wallet.address,
                privateKey: address ? privateKey : wallet.privateKey,
                email,
                secret,
                memberships: poolAddress ? [poolAddress] : [],
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

    static async addRatForAddress(address: string) {
        try {
            const account = await Account.findOne({ address });
            const r = await axios({
                method: 'POST',
                url: ISSUER + '/reg',
                data: {
                    application_type: 'web',
                    grant_types: ['client_credentials'],
                    request_uris: [],
                    redirect_uris: [],
                    post_logout_redirect_uris: [],
                    response_types: [],
                    scope: 'openid admin',
                },
            });
            const rat = r.data.registration_access_token;

            if (account.registrationAccessTokens.length) {
                if (!account.registrationAccessTokens.includes(rat)) {
                    account.registrationAccessTokens.push(rat);
                }
            } else {
                account.registrationAccessTokens = [rat];
            }

            await account.save();

            return { rat };
        } catch (error) {
            return { error };
        }
    }

    static async addMembershipForAddress(assetPool: any, address: string) {
        try {
            const account = await Account.findOne({ address });

            if (!account.memberships.includes(assetPool.address)) {
                account.memberships.push(assetPool.address);
            }

            // TODO Figure out how to move this to the API project, potentially make it part of the assetPoolService
            // const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
            // const hasERC20 = account.erc20.find((erc20: ERC20Token) => erc20.address === tokenAddress);

            // if (!hasERC20) {
            //     account.erc20.push({ address: tokenAddress, network: assetPool.network });
            // }

            await account.save();

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async removeMembershipForAddress(assetPool: any, address: string) {
        try {
            const account = await Account.findOne({ address });

            if (account && account.memberships) {
                const index = account.memberships.indexOf(assetPool.solution.options.address);

                if (index > -1) {
                    account.memberships.splice(index, 1);
                }
            }

            await account.save();

            return { result: true };
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
