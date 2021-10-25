import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const getAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    // TODO Check if the sub is for an account that has a membership to the pool defined in X-AssetPool header
    // Only display the encrypted private key string on the /v1/me endpoint

    try {
        const { account, error } = await AccountService.get(req.params.id);

        if (error) throw new Error(error.message);

        if (account) {
            res.send({
                address: account.address,
                // privateKey: account.privateKey, // TODO display this on /me endpoint
                memberships: account.memberships,
                erc20: account.erc20,
                registrationAccessTokens: account.registrationAccessTokens,
                burnProofs: account.burnProofs,
            });
        }
    } catch (e) {
        next(new HttpError(502, 'Account find failed', e));
    }
};
