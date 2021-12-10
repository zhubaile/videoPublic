import Taro from '@tarojs/taro';
import { NOOP } from './index';
import { events } from './eventManager';
import { ENV } from './env';

/**
 * 显示二次确认弹窗
 * @param onConfirm 点击确认的回调
 * @param onCancel 点击取消的回调
 */
 export function showConfirmModal (
    {
        title = '温馨提示',
        content,
        confirmText = '确定',
        cancelText = '取消',
        onConfirm = NOOP,
        onCancel = NOOP,
        showCancel = true,
    }) {
        Taro.showModal({
            title,
            showCancel,
            content,
            confirmText,
            cancelText,
            success:(res) => {
                if (res.cancel || res.confirm == false) {
                    onCancel();
                }else  {
                    onConfirm();
                }
            },
    });
}

/**
 * 显示loading
 * @param {string} title 
 * @returns 
 */
export function showLoading (title = '加载中...') {
    if (ENV.device == 'pc') {
        events.loading.emit({isShow: true,title:title});
        return;
    }
    Taro.showLoading({ title: title });
}
/**
 * 隐藏loading
 * @returns
 */
export function hideLoading () {
    if (ENV.device == 'pc') {
        events.loading.emit({isShow: false});
        return;
    }
    Taro.hideLoading();
}