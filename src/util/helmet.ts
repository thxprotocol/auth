import helmet from 'helmet';
import { AUTH_URL, DASHBOARD_URL, WALLET_URL } from './secrets';

export const helmetInstance = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: [AUTH_URL],
            frameSrc: [AUTH_URL, WALLET_URL, DASHBOARD_URL],
            frameAncestors: [WALLET_URL, DASHBOARD_URL],
            fontSrc: ['https://fonts.gstatic.com', 'https://ka-f.fontawesome.com/'],
            connectSrc: ['https://ka-f.fontawesome.com'],
            scriptSrcElem: [
                AUTH_URL,
                'https://www.googletagmanager.com',
                'https://kit.fontawesome.com',
                'https://cdn.jsdelivr.net',
                "'sha256-PEI/gdNohg23HbZboqauC7uLjfrpcON9Z4W9IurYRxk='", // self
            ],
            styleSrcElem: [
                AUTH_URL,
                'https://fonts.googleapis.com',
                'https://ka-f.fontawesome.com',
                "'sha256-uCITVBkyNmwuSQXzSNUuRx7G7+1kS2zWJ9SjHF0W2QA='", //
                "'sha256-bepHRYpM181zEsx4ClPGLgyLPMyNCxPBrA6m49/Ozqg='", //https://kit.fontawesome.com
                "'sha256-ZL58hL5KbUHBRnMK797rN7IR+Tg9Aw61ddJ/rmxn1KM='", //https://kit.fontawesome.com
                "'sha256-75mE4wfpMmhCBnDZSF3PLGDQFzUteIHYrgFoOGlCMQw='",
            ],
        },
    },
    // contentSecurityPolicy: false,
    hidePoweredBy: true,
    frameguard: false,
    referrerPolicy: {
        policy: ['origin'],
    },
});
