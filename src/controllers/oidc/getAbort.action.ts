import { Request, Response, NextFunction } from 'express';
import { oidc } from '.';

export default async function getAbortController(req: Request, res: Response, next: NextFunction) {
    try {
        const result = {
            error: 'access_denied',
            error_description: 'End-User aborted interaction',
        };
        await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
        return next(err);
    }
}
