import { isEmpty, NOOP } from './index';
import { ENV } from 'utils/env';
import { Logger } from './logger';
import { getUserInfo } from './userinfo';
import { resetAuthorize } from './resetAuthorize';
import { qnapi } from './qnApi';
import { showConfirmModal } from './prompt';

/**
 * qnRouter这个方法本身是qnapi方法的路由部分
 * 现将qnapi方法的路由部分拆到这个方法中 使qnapi方法只负责网络请求 负责调top或者router/rest
 * 该方法抹平pg与top的差异 在source参数中可选数据来源
 * @param api
 * @param params
 * @param method
 * @param callback
 * @param errCallback
 * @param withoutTry
 * @param fallback 是否在aiyong挂了的时候调top 默认为true
 * @param source 数据源 是top还是aiyong
 * @param rest
 */
export function qnRouter ({
    api,
    method,
    params = {},
    callback = NOOP,
    errCallback = (err) => {
        showConfirmModal({
            title:'淘宝接口调用失败',
            content: err.sub_msg,
            showCancel: false,
        });
    },
    fallback = true,
    source,
    tag,
    pgSaveDisabled = false,
    ...rest
}) {
    if (!api && method) {
        api = method;
    }
    return new Promise((resolve, reject) => {
        const _callback = (res) => {
            resolve(res);
            callback(res);
        };
        const _errCallback = (err) => {
            if(err.sub_code == 'isv.w2-security-authorize-invalid') {
                resetAuthorize();
            } else {
                errCallback(err);
                reject(err);
            }
        };
        if (params != undefined) {
            if (params.nick) {
                params.nick = decodeURI(params.nick);// 解决nick中文编码的影响
            }
        }
        invokeInQn(_callback, _errCallback);

        // 直接走top
        function invokeInQn (callback, errCallback) {
            qnapi({
                api,
                params,
                callback: (rsp) => {
                    Logger.log('qnRouter-QN', api, params, rsp);
                    callback(rsp);
                },
                errCallback: (error) => {
                    if (error instanceof Error) {
                        try{
                            error = JSON.parse(error.message);
                        }catch(e) {
                            error = { msg:'unknown', sub_msg:'unknown error' };
                        }
                    }
                    errCallback(error);
                },
            });
        };
    });
}

export default qnRouter;
