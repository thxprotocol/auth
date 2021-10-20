import express, { json, urlencoded } from 'express';
import compression from 'compression';
import path from 'path';
import db from './util/database';
import oidcRouter from './controllers/oidc/_.routing';
import accountRouter from './controllers/account/_.routing';
import { xframe, xssProtection } from 'lusca';
import { oidc } from './controllers/oidc';
import { requestLogger } from './util/logger';
import { corsHandler } from './util/cors';
import { errorHandler, notFoundHandler } from './util/error';
import { PORT, MONGODB_URI, DASHBOARD_URL, PUBLIC_URL } from './util/secrets';

const app = express();

db.connect(MONGODB_URI);

app.set('trust proxy', true);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('port', PORT);
app.use(corsHandler);
app.use(requestLogger);
app.use(compression());
app.use(xframe('SAMEORIGIN'));
app.use(xssProtection(true));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(
    '/',
    (req, res, next) => {
        res.locals = {
            dashboardUrl: DASHBOARD_URL,
            publicUrl: PUBLIC_URL,
        };
        next();
    },
    oidcRouter,
);
app.use('/account', json(), urlencoded({ extended: true }), accountRouter);
app.use('/', oidc.callback);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
