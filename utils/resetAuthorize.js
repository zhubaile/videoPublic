import Taro from "@tarojs/taro";
import { userInfoInit, authLimited, getUserInfo } from "./userinfo";
import { isEmpty, NOOP } from "./index";

/**
 * 重新授权
 * @returns {*}
 */
export function resetAuthorize ({ callback = NOOP } = {}) {
    if (!my.qn || !my.qn.cleanToken) {
        Taro.showToast({ icon: 'fail', title: '无法重新授权' + !!my.qn + !!((my.qn||{}).cleanToken) });
        return;
    }
    my.qn.cleanToken({
        success: (res) => {
            Taro.showToast({ icon: 'success', title: '清除授权成功' + JSON.stringify(res) });
            userInfoInit(callback);
        },
        fail: (res) => {
            Taro.showToast({ icon: 'fail', title: '清除授权失败' + JSON.stringify(res) });
        },
    });
};

/**
 * 入口、我的页面的重新授权逻辑
 * 和上面的方法区别是这个里面会将主账号才会走userInfoInit、子账号会去联系主账号
 * @export
 * @returns
 */
export function mainResetAuthorize ({userInfo=getUserInfo(),callback = NOOP}){
    if (!my.qn || !my.qn.cleanToken) {
        Taro.showToast({ title: '无法重新授权' + !!my.qn + !!((my.qn||{}).cleanToken) });
        return;
    }
    //符合条件说明是主账号,否则就是子账号
    if(isEmpty(userInfo.subUserNick) && isEmpty(userInfo.sub_nick)){
        my.qn.cleanToken({
            success: (res) => {
                Taro.showToast({ title: '清除授权成功' + JSON.stringify(res) });
                //重新授权之后的
                userInfoInit((resetUserInfo)=>{
                    callback(resetUserInfo);
                });
            },
            fail: (res) => {
                Taro.showToast({ title: '清除授权失败' + JSON.stringify(res) });
            },
        });
    }else{
        authLimited("");
    }
}