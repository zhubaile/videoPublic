import Taro from "@tarojs/taro";
import { ENV } from 'utils/env';
// import { getRemoteLogEnabled, getProxyDeferred, proxySend } from 'utils/qnProxy';

/**
 * 去掉前后 空格/空行/tab 的正则 预先定义 避免在函数中重复构造
 * @type {RegExp}
 */
 let trimReg = /(^\s*)|(\s*$)/g;

 /**
  * 判断一个东西是不是空 空格 空字符串 undefined 长度为0的数组及对象会被认为是空的
  * @param key
  * @returns {boolean}
  */
 export function isEmpty (key) {
     if (key === undefined || key === '' || key === null) {
         return true;
     }
     if (typeof (key) === 'string') {
         key = key.replace(trimReg, '');
         if (key == '' || key == null || key == 'null' || key == undefined || key == 'undefined') {
             return true;
         } else{
             return false;
         }
     } else if (typeof (key) === 'undefined') {
         return true;
     } else if (typeof (key) === 'object') {
         for (let i in key) {
             return false;
         }
         return true;
     } else if (typeof (key) === 'boolean') {
         return false;
     }
 }
/**
 * 构造一个deferred对象 相当于一个resolve reject 外置的promise 可以预先生成这个promise 然后等待这个promise被外部resolve
 * @returns {Promise<unknown>}
 */
 export function getDeferred ()  {
    let resolve, reject;
    let promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    promise.resolve = resolve;
    promise.reject = reject;
    return promise;
};
/**
 * 空函数 避免重复构造空函数
 * @constructor
 */
export function NOOP () {};

/**
 * 是否是ide 最好把这个在上传的时候改成return false 鬼知道千牛的my.qn里有什么 不同人还不一样的
 * @returns {boolean}
 */
 export function isIDE () {
    if (ENV.device === "pc") {
        return !my.qn.openPlugin;
    }
    if (ENV.device === "mobile") {
        return my.isIDE;
    }
}

export const TYPES = {
    Number: '[object Number]',
    String: '[object String]',
    Undefined: '[object Undefined]',
    Boolean: '[object Boolean]',
    Object: '[object Object]',
    Array: '[object Array]',
    Function: '[object Function]',
};

/**
 * 获取一个东西的type 请与上面的常量进行比较
 * @param obj
 * @returns {string}
 */
export function getType (obj) {
    return Object.prototype.toString.call(obj);
}
/**
 * 判断是否是对象
 * @param target
 * @returns {boolean}
 */
 export function isObject (target) {
    return getType(target) === TYPES.Object;
}

/**
 * 判断参数是否是JSON字符串
 * */
export function isJSON (str) {
    try {
        let obj = JSON.parse(str);
        if (isObject(obj) && obj) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

/**
 * 判断是否是array
 * @param target
 * @returns {boolean}
 */
export function isArray (target) {
    return getType(target) === TYPES.Array;
}

/**
 * 判断是否是函数
 * @param target
 * @returns {boolean}
 */
export function isFunction (target) {
    return getType(target) === TYPES.Function;
}
// 动画延时
export function sleep (time) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}