import { Response, NextFunction } from 'express';
import { ERROR_CREATE_ACCOUNT, ERROR_DUPLICATE_EMAIL } from '../../util/messages';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const postAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function checkDuplicateEmail() {
        const { result, error } = await AccountService.isEmailDuplicate(req.body.email);

        if (error) {
            throw new Error(ERROR_DUPLICATE_EMAIL);
        }

        return result;
    }

    async function createAccount() {
        const { account, error } = await AccountService.signupFor(req.body.email, req.body.password, req.body.address);

        if (error) throw new Error(ERROR_CREATE_ACCOUNT);

        return account;
    }

    async function getAccount() {
        const { account, error } = await AccountService.getByEmail(req.body.email);
        if (error) throw new Error(ERROR_CREATE_ACCOUNT);
        return account;
    }

    try {
        const isDuplicate = await checkDuplicateEmail();
        const account = isDuplicate ? await getAccount() : await createAccount();

        res.status(201).json({
            id: account._id,
            address: account.address,
        });
    } catch (error) {
        return next(new HttpError(502, error.message, error));
    }
};

/**
 * @swagger
 * /signup:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Creates an account using email and password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: Email to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: password
 *         description: Password to use for login.
 *         in: body
 *         required: true
 *         type: string
 *       - name: confirmPassword
 *         description: Password to use for confirmation.
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       '201':
 *         description: Created
 *         schema:
 *             type: object
 *             properties:
 *                address:
 *                   type: string
 *                   description: The address for the new account.
 *       '400':
 *         description: Bad Request. Indicated incorrect body parameters.
 *       '422':
 *         description: Duplicate. An account for this email already exists.
 *       '500':
 *         description: Internal Server Error.
 *       '502':
 *         description: Bad Gateway. Received an invalid response from the network or database.
 */
