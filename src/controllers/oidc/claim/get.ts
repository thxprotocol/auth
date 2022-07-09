import { Request, Response } from 'express';
import { YouTubeService } from './../../../services/YouTubeService';
import { ChannelAction, ChannelType } from '../../../models/Reward';
import { getChannelScopes, getLoginLinkForChannelAction } from '../../../util/social';
import BrandProxy from '../../../proxies/BrandProxy';

async function controller(req: Request, res: Response) {
    const { uid, params } = req.interaction;
    const rewardData = JSON.parse(Buffer.from(params.reward_hash, 'base64').toString());
    const poolId = rewardData.poolId;
    const brandData = await BrandProxy.get(poolId);

    params.rewardData = rewardData;
    params.googleLoginUrl = YouTubeService.getLoginUrl(req.params.uid, YouTubeService.getExpandedScopes());
    params.backgroundImgUrl = brandData?.backgroundImgUrl;
    params.logoImgUrl = brandData?.logoImgUrl;

    if (!rewardData.rewardCondition || !rewardData.rewardCondition.channelType) {
        return res.render('signin', {
            uid,
            params,
            alert: {
                variant: 'success',
                message: `Sign in and claim your <strong>${rewardData.rewardAmount} ${rewardData.tokenSymbol}</strong>!`,
            },
        });
    }

    params.channelType = ChannelType[rewardData.rewardCondition.channelType];
    params.channelAction = ChannelAction[rewardData.rewardCondition.channelAction];
    params.channelItem = rewardData.rewardCondition.channelItem;

    const scopes = getChannelScopes(rewardData.rewardCondition.channelAction);
    const loginLink = getLoginLinkForChannelAction(uid, rewardData.rewardCondition.channelAction);

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
