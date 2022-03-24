import { AccountPlanType } from './enums/AccountPlanType';

export interface TAccount {
    firstName: string;
    lastName: string;
    plan: AccountPlanType;
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
    comparePassword: any;
    createdAt: Date;
}
