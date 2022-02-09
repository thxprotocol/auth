import 'newrelic';
import http from 'http';
import app from './app';
import db from './util/database';
import { createTerminus } from '@godaddy/terminus';
import { healthCheck } from './util/healthcheck';
import { logger } from './util/logger';

const server = http.createServer(app);

const options = {
    healthChecks: {
        '/healthcheck': healthCheck,
        'verbatim': true,
    },
    onSignal: (): Promise<any> => {
        logger.info('Server shutting down');
        return Promise.all([db.disconnect()]);
    },
    logger: logger.error,
};

createTerminus(server, options);

process.on('uncaughtException', function (err: Error) {
    if (err) {
        logger.error({
            message: 'Uncaught Exception was thrown, shutting down',
            errorName: err.name,
            errorMessage: err.message,
            stack: err.stack,
        });
        process.exit(1);
    }
});

logger.info(`Server is starting on port: ${app.get('port')}, env: ${app.get('env')}`);
server.listen(app.get('port'));

export default server;
