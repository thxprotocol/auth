import { Request, Response } from 'express';
import { YouTubeService } from './../../../services/YouTubeService';
import { ChannelAction, ChannelType } from '../../../models/Reward';
import { getChannelScopes, getLoginLinkForChannelAction } from '../../../util/social';
import BrandProxy from '../../../proxies/BrandProxy';
import { BadRequestError } from '../../../util/errors';
import ClaimProxy from '../../../proxies/ClaimProxy';
import { AUTH_REQUEST_TYPED_MESSAGE, createTypedMessage } from '../../../util/typedMessage';
import { AUTH_URL } from '../../../util/secrets';

async function controller(req: Request, res: Response) {
    const { uid, params } = req.interaction;

    let claim;
    if (params.reward_hash) {
        claim = await ClaimProxy.getByHash(params.reward_hash);
    } else if (params.claim_id) {
        claim = await ClaimProxy.get(params.claim_id);
    } else {
        throw new BadRequestError('No reward_hash or claim_id found in user state');
    }

    const brandData = await BrandProxy.get(claim.poolId);

    params.rewardData = claim;

    // Appearance settings for the pool
    params.backgroundImgUrl = brandData?.backgroundImgUrl;
    params.logoImgUrl = brandData?.logoImgUrl;

    // Render the regular signin page success alert
    if (!claim.withdrawCondition || !claim.withdrawCondition.channelType) {
        params.googleLoginUrl = YouTubeService.getLoginUrl(req.params.uid, YouTubeService.getBasicScopes());
        params.authRequestMessage = createTypedMessage(AUTH_REQUEST_TYPED_MESSAGE, AUTH_URL, uid);

        let message = `Sign in and claim your <strong>${claim.withdrawAmount} ${claim.tokenSymbol}</strong>!`;
        if (params.rewardData.erc721Id) {
            message = `<i class="fas fa-gift mr-2"></i> Sign in and claim your <strong>${claim.tokenSymbol}</strong> NFT!`;
        }

        return res.render('signin', {
            uid,
            params,
            alert: {
                variant: 'success',
                message,
            },
        });
    }

    params.channelType = ChannelType[claim.withdrawCondition.channelType];
    params.channelAction = ChannelAction[claim.withdrawCondition.channelAction];
    params.channelItem = claim.withdrawCondition.channelItem;

    const scopes = getChannelScopes(claim.withdrawCondition.channelAction);
    const loginLink = getLoginLinkForChannelAction(uid, claim.withdrawCondition.channelAction);

    res.render('claim', {
        uid,
        params: {
            ...params,
            ...scopes,
            ...loginLink,
        },
        alert: {},
    });
}

export default { controller };
