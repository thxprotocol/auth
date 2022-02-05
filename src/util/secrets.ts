import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';

dotenv.config();

const required = [
    'ISSUER',
    'AUTH_URL',
    'WALLET_URL',
    'PUBLIC_URL',
    'DASHBOARD_URL',
    'MONGODB_URI',
    'PORT',
    'SECURE_KEY',
    'SENDGRID_API_KEY',
    'TWITTER_CLIENT_ID',
];

required.forEach((value: string) => {
    if (!process.env[value]) {
        console.log(`Set ${value} environment variable.`);
        process.exit(1);
    }
});

// This allows you to use a single .env file with both regular and test configuration. This allows for an
// easy to use setup locally without having hardcoded credentials during test runs.
if (process.env.NODE_ENV === 'test') {
    if (process.env.PORT_TEST !== undefined) process.env.PORT = process.env.PORT_TEST;
    if (process.env.MONGODB_URI_TEST !== undefined) process.env.MONGODB_URI = process.env.MONGODB_URI_TEST;
    if (process.env.TESTNET_RPC_TEST !== undefined) process.env.TESTNET_RPC = process.env.TESTNET_RPC_TEST;
}

export const VERSION = 'v1';
export const NODE_ENV = process.env.NODE_ENV;
export const ISSUER = process.env.ISSUER;
export const AUTH_URL = process.env.AUTH_URL;
export const WALLET_URL = process.env.WALLET_URL;
export const PUBLIC_URL = process.env.PUBLIC_URL;
export const DASHBOARD_URL = process.env.DASHBOARD_URL;
export const WIDGETS_URL = process.env.WIDGETS_URL;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT;
export const SECURE_KEY = process.env.SECURE_KEY;
export const GTM = process.env.GTM;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
export const INITIAL_ACCESS_TOKEN = process.env.INITIAL_ACCESS_TOKEN;
export const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
export const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;
export const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

export function locals(req: Request, res: Response, next: NextFunction) {
    res.locals = {
        gtm: GTM,
        dashboardUrl: DASHBOARD_URL,
        walletUrl: WALLET_URL,
        publicUrl: PUBLIC_URL,
    };
    next();
}
