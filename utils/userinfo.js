import Taro from '@tarojs/taro';
import { ENV } from 'utils/env';
import { getDeferred, isIDE, NOOP, isEmpty } from './index';
import { Logger } from './logger';
import { entry, initphpSessionIdDeferred, api } from './api';
import { storage } from './storage';
import { events } from './eventManager';
import { showConfirmModal } from './prompt';

export const userInfoDeferred = getDeferred();
export const userNickDeffered = getDeferred();
export const authDeferred = getDeferred();
export const testUser = {
    // access_token: '80008901239nOZZ0nyiqvaetdbBax3PuyeKkOjvhtyCCYnpugNQ12fee8d2VRQMROONUpfU5',
    nickName: 'd柏乐d0902', // d柏乐d0902
};

let _userInfo = {}; // 用户信息

// 获取用户信息
export const getUserInfo = () => {
    return _userInfo || {};
};
// 更新用户信息
export const setUserInfo = (newUserInfo) => {
    _userInfo = { ..._userInfo, ...newUserInfo };
    return _userInfo;
};
/*
 * @Description 接入tc/user，获取用户信息
*/
export const userInfoInit = (callback = NOOP) => {
    initphpSessionIdDeferred();
    authorize().then((res) => {
        const nick = !isEmpty(res) ? res.nickName : testUser.nickName;
        userNickDeffered.resolve(nick);
        entry({
            callback: (userInfoEntry) => {
                setUserInfo(userInfoEntry);
            },
        });
        // 这里说明是主账号正在在授权，保存到后端 意味着永远都不会授权失效才对
        if (!isEmpty(res.nickName) && !res.nickName.includes(':')) {
            if (ENV.app == 'item') {
                saveMainAccessToken();
            }
        }
        fetchUserInfoFromTcUser({
            nick,
            callback: (newUserInfo) => {
                // 添加一些便于使用的userInfo相关内容
                // 把tag转成set
                if (newUserInfo.tag) {
                    newUserInfo.tagSet = new Set(newUserInfo.tag.split(','));
                }
                // // 该展示的账号版本
                // newUserInfo.showVipState = newUserInfo.isPremium ? '尊享会员' : getUserVipFlagName(newUserInfo.vipFlag);
                // // 用户版本剩余天数
                // newUserInfo.vipRemain = getVipRemain(newUserInfo.vipTime);
                // // 展示用的到期时间
                // let showVipTime = '';
                // if (newUserInfo.vipRemain === 1) {
                //     showVipTime = '今天到期';
                // } else if (judgeRenew('high', newUserInfo.vipRemain)) {
                //     showVipTime = `剩余${newUserInfo.vipRemain}天`;
                // } else {
                //     showVipTime = `到期时间：${newUserInfo.vipTime}`;
                // }
                // newUserInfo.showVipTime = showVipTime;
                // // 展示用的升级/续费按钮
                // newUserInfo.showPayBtn = newUserInfo.vipFlag ? '续费' : '升级';
                // 判断是否是子账号
                if (!isEmpty(newUserInfo.sub_nick)) {
                    newUserInfo.subUserNick = newUserInfo.sub_nick;
                }
                // // oaid灰度用户信息
                // newUserInfo.isOaidTestUser = newUserInfo.tagSet && newUserInfo.tagSet.has('oaidTestUser');
                Logger.warn('fetchUserInfoFromTcUser', newUserInfo);
                setUserInfo(newUserInfo);
                userInfoDeferred.resolve(newUserInfo);
                events.userInfoCallback.emit(newUserInfo);
                callback(newUserInfo);
                // getCheckinData(nick).then((res) => {
                //     checkIn_dispatch(res);
                // });
                // getNewUserTasksData(nick).then((res) => {
                //     newUserTasks_dispatch(res);
                // });
                // // 获取用户的降级信息
                // getDownGradeInfo();
                // if (ENV.app == 'trade') {
                //     setEncryptSetting();
                // } else if (ENV.app === 'item') {
                //     const entry = getEntry();
                //     const quickFunc = getQuickFunc();
                //     const m1 = entry === SECONDARY_PAGE ? SECONDARY_PAGE : 'mbItemEntry';
                //     const m2 = entry === SECONDARY_PAGE ? quickFunc : entry;
                //     const m3 = getOrigin();
                //     const m5 = quickFunc === SECONDARY_MORE ? SECONDARY_MORE : m2;
                //     itemBeacon({ page: 'entry', func: m1, m1, m2, m3, m5 });
                // }
            },
        });
    });
};

/**
 * 授权失败 并弹出对话框 可以选择退出或者重新授权 重新授权会清除授权
 * @param location
 * @param err
 */
 async function authFailed (location, err) {
    console.log('auth failed', location, err);
    err = JSON.stringify(err);
    userInfoDeferred.resolve(err);
    const retry = await new Promise((resolve) => {
        showConfirmModal({
            content: `授权失败${location}${err}`,
            cancelText: '退出',
            confirmText: '重试',
            onCancel: () => {
                my.qn.returnData();
                resolve(false);
            },
            onConfirm: () => {
                my.qn.cleanToken({
                    success: (res) => {
                        Taro.showToast({ icon: 'success', title: `清除授权成功${JSON.stringify(res)}` });
                        resolve(true);
                    },
                    fail: (res) => {
                        Taro.showToast({ icon: 'fail', title: `清除授权失败${JSON.stringify(res)}` });
                        resolve(true);
                    },
                });
            },
        });
    });
    if (retry) {
        return authorize();
    }
    return;
}

/**
 * 授权 并拿到用户信息
 * @returns {Promise<{access_token: string, nickName: string}|{[p: string]: *}|{access_token: string, nickName: string}|*|undefined>}
 */
 export async function authorize () {
    if (isIDE()) {
        Logger.error('auth dev mode',);
        authDeferred.resolve(testUser);
        return testUser;
    }
    try {
        const { authRes, authErr } = await new Promise((resolve) => {
            my.authorize({
                scopes: '*',
                success: (authRes) => {
                    console.log('authorize', authRes);
                    setUserInfo({ accessToken: authRes.accessToken });
                    resolve({ authRes });
                },
                fail: (authErr) => {
                    resolve({ authErr });
                },
            });
        });
        if (authErr) {
            return authFailed('authorize_fail', authErr);
        }
        authDeferred.resolve(authRes);

        const { userRes, userErr } = await new Promise((resolve) => {
            my.getAuthUserInfo({
                success: (userRes) => {
                    resolve({ userRes });
                },
                fail: (userErr) => {
                    resolve({ userErr });
                },
            });
        });

        /**
         * 这个地方可能是accessToken失效
         * 具体逻辑是这样的:
         *
         * 第一次进入小程序调用`my.authorize` 会得到一个accessToken 然后千牛会存在本地
         * 然后下次进来判断本地有没有 如果有 那就直接走success
         * 但是这个缓存里的accessToken是不一定有效的
         * 也就是虽然`my.authorize`走到了success 但是返回出来的accessToken在服务器看来是无效的
         * 然后这个`my.getAuthUserInfo`走到fail 大概率就是accessToken失效了 需要重新授权
         * 重新授权就是调用my.clearToken将本地的accessToken缓存清除 然后调my.authorize 重新授权
         */
        if (userErr) {
            /**
             * 如果是手机小程序时会自动调用重新授权，
             * 重复return authorize方法会导致手机小程序重复弹出授权弹窗
             */
            if (ENV.device === 'mobile') {
                return;
            }
            /**
             * 由于accessToken失效，获取用户信息会失败，所以会走到这一步
             * 这里不采用 my.clearToken 将本地的accessToken 缓存清除的原因是：
             * 用户的数据和 accessToken 绑定到一起，如果将它清除，这时再调用my.authorize时会提示登录失效
             * 登录失效是原本的登录状态和此时已经不匹配，所以需要关闭插件重新打开
             * 解决这个只需要重新调用一次授权，这时会分配一个新的accessToken保存到本地即可
             */
            return authorize();
        }
        return setUserInfo(userRes);
    } catch (e) {
        return authFailed('authorize throw', e);
    }
};

/*
 * @Description 从tcUser获取用户信息
*/
export const fetchUserInfoFromTcUser = ({ callback, nick }) => {
    const args = { isqap: 1, slot: 'miniapp' };
    if (isIDE()) {
        args.nick = testUser.nickName;
        args.access_token = testUser.access_token;
    }
    api({
        apiName: ENV.userApiName,
        path: '/tc/user',
        args,
        callback: (res) => {
            const newUserInfo = {
                userNick: res.nick,
                vipFlag: res.vipflag,
                vipTime: res.order_cycle_end.split(' ')[0],
                // 是否为H版用户，H版用户不显示广告
                isH: res.h == 1,
                createDate: res.createdate,
                lastPaidTime: res.last_paid_time,
                tag: res.tag,
                renewMessage: res.vip_renew_message,
                notice: res.notice,
                renewDatas: res.renewDatas,
                sub_nick: res.sub_nick,
                user_id: res.user_id,
                newMemoSet: res.newMemoSet || 0,
                needauth: res.needauth,
                type: res.miniapp_shop_type,
                expire_days: res.expire_days,
                promotion: res.promotion,
                remainNewUser: res.remainNewUser,
                order_total: res.order_total,
                originTag: res.originTag,
                isPremium: res.isPremium || false,
                privilegeBabyUser: res.privilegeBabyUser,
                vipNumIidStr: res.privilegeBabyNumIds || '',
                adDates: res.mb_ad_dates,
                orderNum: res.month_order,
                adNums: res.show_ad_nums,
            };
            // 为尊享版保存一个缓存信息，可以让下一次提前加载尊享版界面
            storage.setItem('lastIsPremium', res.isPremium ? 1 : 0);
            // 解决信息中没有 sellerType、avatar 在entry中获取不到的问题
            if (!isEmpty(res.userInfo)) {
                Object.assign(newUserInfo, res.userInfo);
            }
            if (ENV.app == 'item') {
                if (!isEmpty(res.miniappConfig)) {
                    Object.assign(newUserInfo, res.miniappConfig);
                }
            }
            callback(newUserInfo);
        },
    });
};

/**
 * 保存主账号授权
 */
 export const saveMainAccessToken = async () => {
    if (isIDE()) {
        console.log("测试模式不需要保存token");
    } else {
        await new Promise((resolve) => {
            api({
                apiName: ENV.saveTokenApi,
                callback: (res) => {
                    Logger.warn('saveMainAccessToken-callback', res);
                    resolve(res);
                },
                errCallback: (error) => {
                    Logger.warn('saveMainAccessToken-errCallback', error);
                    resolve(error);
                },
            });
        });
    }
};