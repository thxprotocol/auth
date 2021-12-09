import helmet from 'helmet';

export const helmetInstance = helmet({
    referrerPolicy: {
        policy: ['origin'],
    },
});
