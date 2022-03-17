import bcrypt from 'bcrypt-nodejs';
import mongoose from 'mongoose';
import { encryptString } from '../util/encrypt';

export interface IAccount {
    firstName: string;
    lastName: string;
    type: string;
    plan: string;
    organisation: string;
    active: boolean;
    email: string;
    password: string;
    address: string;
    privateKey: string;
    signupToken: string;
    otpSecret: string;
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
    spotifyAccessToken: string;
    spotifyRefreshToken: string;
    spotifyAccessTokenExpires: number;
    acceptTermsPrivacy: boolean;
    acceptUpdates: boolean;
    recoveryPhrase: string;
    comparePassword: any;
}

export interface IAccountUpdates {
    acceptTermsPrivacy?: boolean;
    acceptUpdates?: boolean;
    address?: string;
    privateKey?: string;
    googleAccess?: boolean;
    twitterAccess?: boolean;
    spotifyAccess?: boolean;
    authenticationToken?: string;
    authenticationTokenExpires?: number;
    firstName?: string;
    lastName?: string;
    type?: string;
    plan?: string;
    organisation?: string;

}

export type AccountDocument = mongoose.Document & IAccount;

const accountSchema = new mongoose.Schema(
    {
        active: Boolean,
        firstName: String,
        lastName: String,
        organisation: String,
        type: String,
        plan: String,
        email: { type: String, unique: true },
        password: String,
        address: String,
        privateKey: String,
        signupToken: String,
        otpSecret: String,
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
        twitterAccessTokenExpires: Number,
        spotifyAccessToken: String,
        spotifyRefreshToken: String,
        spotifyAccessTokenExpires: Number,
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
    return bcrypt.compareSync(candidatePassword, this.password);
};

accountSchema.methods.comparePassword = comparePassword;

export const Account = mongoose.model<AccountDocument>('Account', accountSchema);
