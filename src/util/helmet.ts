import helmet from 'helmet';

export const helmetInstance = helmet({
    contentSecurityPolicy: false,
    referrerPolicy: {
        policy: ['origin'],
    },
});
