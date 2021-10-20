import dotenv from 'dotenv';
import { logger } from './logger';

export const VERSION = 'v1';
export const ENVIRONMENT = process.env.NODE_ENV;

dotenv.config({ path: ENVIRONMENT === 'test' ? '.env.ci' : '.env' });

const required = [
    'ISSUER',
    'WALLET_URL',
    'PUBLIC_URL',
    'DASHBOARD_URL',
    'MONGODB_URI',
    'PORT',
    'SECURE_KEY',
    'SENDGRID_API_KEY',
];

required.forEach((value: string) => {
    if (!process.env[value]) {
        const message = `Set ${value} environment variable.`;
        logger.error(message);
        process.exit(1);
    }
});

export const ISSUER = process.env.ISSUER;
export const WALLET_URL = process.env.WALLET_URL;
export const PUBLIC_URL = process.env.PUBLIC_URL;
export const DASHBOARD_URL = process.env.DASHBOARD_URL;
export const WIDGETS_URL = process.env.WIDGETS_URL;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT;
export const SECURE_KEY = process.env.SECURE_KEY;
export const GTM = process.env.GTM;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
