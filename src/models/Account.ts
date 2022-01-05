import bcrypt from 'bcrypt-nodejs';
import mongoose from 'mongoose';
import { encryptString } from '../util/encrypt';

export interface IAccount {
    active: boolean;
    email: string;
    password: string;
    address: string;
    privateKey: string;
    signupToken: string;
    signupTokenExpires: number;
    authenticationToken: string;
    authenticationTokenExpires: number;
    passwordResetToken: string;
    passwordResetExpires: number;
    googleAccessToken: string;
    googleRefreshToken: string;
    googleAccessTokenExpires: number;
    twitterAccessToken: string;
    twitterRefreshToken: string;
    twitterAccessTokenExpires: number;
    acceptTermsPrivacy: boolean;
    acceptUpdates: boolean;
    recoveryPhrase: string;
    comparePassword: Function;
}

export interface IAccountUpdates {
    acceptTermsPrivacy?: boolean;
    acceptUpdates?: boolean;
    address?: string;
    privateKey?: string;
    googleAccess?: boolean;
    twitterAccess?: boolean;
}

export type AccountDocument = mongoose.Document & IAccount;

const accountSchema = new mongoose.Schema(
    {
        active: Boolean,
        email: { type: String, unique: true },
        password: String,
        address: String,
        privateKey: String,
        signupToken: String,
        signupTokenExpires: Date,
        authenticationToken: String,
        authenticationTokenExpires: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        googleAccessToken: String,
        googleRefreshToken: String,
        googleAccessTokenExpires: Number,
        twitterAccessToken: String,
        twitterRefreshToken: String,
        twitterAccessTokenExpires: String,
        acceptTermsPrivacy: Boolean,
        acceptUpdates: Boolean,
        recoveryPhrase: String,
    },
    { timestamps: true },
);

/**
 * Password hash middleware.
 */
accountSchema.pre('save', function save(next) {
    const account = this as AccountDocument;

    if (!account.isModified('password')) {
        return next();
    }

    if (account.privateKey) {
        account.privateKey = encryptString(account.privateKey, account.password);
    }

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(account.password, salt, undefined, (err: mongoose.Error, hash) => {
            if (err) {
                return next(err);
            }
            account.password = hash;
            next();
        });
    });
});

const comparePassword = function (candidatePassword: string) {
    try {
        const isMatch = bcrypt.compareSync(candidatePassword, this.password);
        return { isMatch };
    } catch (error) {
        return { error };
    }
};

accountSchema.methods.comparePassword = comparePassword;

export const Account = mongoose.model<AccountDocument>('Account', accountSchema);
