import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { GTM } from '../../util/secrets';
import AccountService from '../../services/AccountService';

export default async function postResetController(req: Request, res: Response, next: NextFunction) {
    try {
        const { sub, error } = await AccountService.getSubForPasswordResetToken(
            req.body.password,
            req.body.passwordConfirm,
            req.body.passwordResetToken,
        );
        if (error) {
            return res.render('reset', {
                uid: req.params.uid,
                params: {
                    return_url: req.body.returnUrl,
                    password_reset_token: req.body.passwordResetToken,
                },
                alert: {
                    variant: 'danger',
                    message: error.toString(),
                },
                gtm: GTM,
            });
        } else {
            return res.render('reset', {
                uid: req.params.uid,
                params: {
                    return_url: req.body.returnUrl,
                    password_reset_token: req.body.passwordResetToken,
                },
                alert: {
                    variant: 'success',
                },
                gtm: GTM,
            });
        }
    } catch (error) {
        return next(new HttpError(500, error.toString(), error));
    }
}
