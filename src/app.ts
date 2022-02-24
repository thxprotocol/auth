import 'express-async-errors';
import express, { json, urlencoded } from 'express';
import compression from 'compression';
import path from 'path';
import db from './util/database';
import oidcRouter from './controllers/oidc/_.routing';
import accountRouter from './controllers/account/_.routing';
import healthRouter from './controllers/health/_.routing';
import expressEJSLayouts from 'express-ejs-layouts';
import { helmetInstance } from './util/helmet';
import { xframe, xssProtection } from 'lusca';
import { oidc } from './controllers/oidc';
import { requestLogger } from './util/logger';
import { PORT, MONGODB_URI, GTM, DASHBOARD_URL, WALLET_URL, PUBLIC_URL } from './util/secrets';
import { errorLogger, errorNormalizer, errorOutput, notFoundHandler, corsHandler } from './middlewares';

const app = express();

db.connect(MONGODB_URI);

app.set('port', PORT);
app.set('trust proxy', true);
app.set('layout', './layouts/default');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(compression());
app.use(helmetInstance);
app.use(corsHandler);
app.use(requestLogger);
app.use(expressEJSLayouts);
app.use(xframe('SAMEORIGIN'));
app.use(xssProtection(true));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/', oidcRouter);
app.use('/account', json(), urlencoded({ extended: true }), accountRouter);
app.use('/health', json(), urlencoded({ extended: true }), healthRouter);
app.use('/', oidc.callback);
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorNormalizer);
app.use(errorOutput);

app.locals = Object.assign(app.locals, {
    gtm: GTM,
    dashboardUrl: DASHBOARD_URL,
    walletUrl: WALLET_URL,
    publicUrl: PUBLIC_URL,
});

export default app;
