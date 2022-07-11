import { apiClient } from '../util/api';

interface brandUpdateParams {
    logoImgUrl: string;
    backgroundImgUrl: string;
}

export default {
    get: async (poolId: string) => {
        const r = await apiClient({
            method: 'GET',
            url: `/v1/brand/${poolId}`,
        });

        return r.data;
    },

    update: async (poolId: string, params: Partial<brandUpdateParams>) => {
        const r = await apiClient({
            method: 'PUT',
            url: `/v1/brand/${poolId}`,
            data: params,
        });

        return r.data;
    },
};
