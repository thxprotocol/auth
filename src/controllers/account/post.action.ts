import { Request, Response } from 'express';

import { AccountService } from '../../services/AccountService';
import airtable from '../../util/airtable';

export const postAccount = async (req: Request, res: Response) => {
    const userExists = await AccountService.isActiveUserByEmail(req.body.email);

    let account;

    if (!userExists) {
        account = await AccountService.signupFor(req.body.email, req.body.password, req.body.address);

        await airtable.pipelineSignup({
            Email: account.email,
            Date: account.createdAt,
        });
    } else {
        account = await AccountService.getByEmail(req.body.email);
    }

    res.status(201).json({
        id: account._id,
        address: account.address,
    });
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
