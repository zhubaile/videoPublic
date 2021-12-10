import { NOOP } from 'utils/index';
import { getCloud } from 'utils/cloud';
import { authDeferred } from 'utils/userinfo';
// import { api as Api } from 'utils/api';
import { getProxyDeferred, getQNProxyEnabled, invokeTopProxy } from 'utils/qnProxy';

/**
 * top请求调用 从小程序云
 * @param api
 * @param params
 * @param callback
 * @param errCallback
 */
let invokeTop = ({ api, params, callback, errCallback }) => {
    let successFlag = 0;
    params = JSON.parse(JSON.stringify(params));
    Object.keys(params).map(key => {
        if (Array.isArray(params[key]) && !params[key].some(item => typeof item === 'object')) {
            params[key] = params[key].join(',');
        }
    });
    authDeferred.then(() => {
        getCloud().topApi.invoke({
            api: api,
            data: params,
        }).then((res) => {
            successFlag = 1;
            callback(res);
        }).catch((err) => {
            if (successFlag) {
                return;
            }
            errCallback(err);
        });
    });
};
/**
 * qnapi
 *  其中如果QNProxy打开后走QNProxy
 * @param api
 * @param params
 * @param callback
 * @param errCallback
 */
export function qnapi (
    {
        api,
        params = {},
        callback = NOOP, errCallback = NOOP,
    }) {
    if (getQNProxyEnabled()) {
        getProxyDeferred().then(() => {
            invokeTopProxy({
                api,
                params,
                callback,
                errCallback,
            });
        });
    } else {
        invokeTop({
            api,
            params,
            callback,
            errCallback,
        });
    }

};
