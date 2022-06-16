import { apiClient, getAuthAccessToken } from '../util/api';
import { THXError } from '../util/errors';

interface brandUpdateParams {
    logoImgUrl: string;
    backgroundImgUrl: string;
}

class NobrandError extends THXError {}

export default {
    get: async (poolAddress: string) => {
        const r = await apiClient({
            method: 'GET',
            url: `/v1/brand/${poolAddress}`,
            headers: {
                Authorization: await getAuthAccessToken(),
            },
        });

        return r.data;
    },

    update: async (poolAddress: string, params: Partial<brandUpdateParams>) => {
        const r = await apiClient({
            method: 'PUT',
            url: `/v1/brand/${poolAddress}`,
            headers: {
                Authorization: await getAuthAccessToken(),
            },
            data: params,
        });

        return r.data;
    },
};
