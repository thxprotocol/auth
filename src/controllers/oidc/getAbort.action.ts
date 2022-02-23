import { Request, Response } from 'express';
import { oidc } from '.';

export default async function getAbortController(req: Request, res: Response) {
    const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction',
    };
    await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
}
