import { apiClient, getAuthAccessToken } from '../util/api';
import { THXError } from '../util/errors';

class NoClaimError extends THXError {}

export default {
    get: async (claimId: string) => {
        const r = await apiClient({
            method: 'GET',
            url: `/v1/claim/${claimId}`,
            headers: {
                Authorization: await getAuthAccessToken(),
            },
        });
        if (r.status !== 200) throw new NoClaimError();
        return r.data;
    },
};
