import helmet from 'helmet';
import { AUTH_URL, DASHBOARD_URL, WALLET_URL } from './secrets';

export const helmetInstance = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: [AUTH_URL, "'unsafe-eval'"],
            frameSrc: [AUTH_URL, WALLET_URL, DASHBOARD_URL],
            frameAncestors: [WALLET_URL, DASHBOARD_URL],
            fontSrc: ['https://fonts.gstatic.com', 'https://ka-f.fontawesome.com/'],
            connectSrc: ['https://ka-f.fontawesome.com'],
            scriptSrcElem: [
                AUTH_URL,
                'https://www.googletagmanager.com',
                'https://kit.fontawesome.com',
                'https://cdn.jsdelivr.net',
                'https://unpkg.com/',
                'https://cdnjs.cloudflare.com',
                // "'sha256-PEI/gdNohg23HbZboqauC7uLjfrpcON9Z4W9IurYRxk='",
                "'unsafe-inline'", // TODO Remove and add hash when done with unsafe-inline script
            ],
            styleSrcElem: [
                AUTH_URL,
                'https://fonts.googleapis.com',
                'https://ka-f.fontawesome.com',
                "'sha256-uCITVBkyNmwuSQXzSNUuRx7G7+1kS2zWJ9SjHF0W2QA='",
                "'sha256-bepHRYpM181zEsx4ClPGLgyLPMyNCxPBrA6m49/Ozqg='",
                "'sha256-ZL58hL5KbUHBRnMK797rN7IR+Tg9Aw61ddJ/rmxn1KM='",
                "'sha256-75mE4wfpMmhCBnDZSF3PLGDQFzUteIHYrgFoOGlCMQw='",
            ],
        },
    },
    hidePoweredBy: true,
    frameguard: false,
    referrerPolicy: {
        policy: ['origin'],
    },
});
