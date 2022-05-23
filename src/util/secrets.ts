import dotenv from 'dotenv';

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
    'TWITTER_CLIENT_ID',
    'AWS_BUCKET_NAME',
    'AWS_BUCKET_REGION',
    'AWS_ACCESS_KEY',
    'AWS_SECRET_KEY',
    'AWS_ARN_KEY',
];

// For production (docker containers) we should require JWKS_JSON to be set since otherwise each container
// would generate their own jwks.json.
if (process.env.NODE_ENV === 'production') {
    required.push('SENDGRID_API_KEY', 'JWKS_JSON');
}

required.forEach((value: string) => {
    if (!process.env[value]) {
        console.log(`Set ${value} environment variable.`);
        process.exit(1);
    }
});

// This allows you to use a single .env file with both regular and test configuration. This allows for an
// easy to use setup locally without having hardcoded credentials during test runs.
if (process.env.NODE_ENV === 'test') {
    if (process.env.PORT_TEST_OVERRIDE !== undefined) process.env.PORT = process.env.PORT_TEST_OVERRIDE;
    if (process.env.MONGODB_URI_TEST_OVERRIDE !== undefined)
        process.env.MONGODB_URI = process.env.MONGODB_URI_TEST_OVERRIDE;
}

export const VERSION = 'v1';
export const TWITTER_API_ENDPOINT = 'https://api.twitter.com/2';
export const SPOTIFY_API_ENDPOINT = 'https://api.spotify.com/v1';
export const NODE_ENV = process.env.NODE_ENV;
export const ISSUER = process.env.ISSUER;
export const AUTH_URL = process.env.AUTH_URL;
export const WALLET_URL = process.env.WALLET_URL;
export const PUBLIC_URL = process.env.PUBLIC_URL;
export const DASHBOARD_URL = process.env.DASHBOARD_URL;
export const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
export const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
export const WIDGETS_URL = process.env.WIDGETS_URL;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT;
export const SECURE_KEY = process.env.SECURE_KEY;
export const GTM = process.env.GTM;
export const AWS_ARN_KEY = process.env.AWS_ARN_KEY;
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
export const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
export const INITIAL_ACCESS_TOKEN = process.env.INITIAL_ACCESS_TOKEN;
export const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
export const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;
export const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
export const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
export const JWKS_JSON = process.env.JWKS_JSON;
