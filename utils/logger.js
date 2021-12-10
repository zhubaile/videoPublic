import { getRemoteLogEnabled, getProxyDeferred, proxySend } from 'utils/qnProxy';
import { getSettings } from 'utils/settings';
import { getSystemInfo } from 'utils/systemInfo';
import { showConfirmModal } from 'utils/prompt';

const LEVELS = {
    error:0,
    warn:1,
    log:2,
    debug:3,
};

/**
 * 日志输出
 */
 export const Logger = {
    debug: (...args) => { // 这边的重复是为了ide的补全
        _log('debug', ...args);
    },
    log: (...args) => {
        _log('log', ...args);
    },
    warn: (...args) => {
        _log('warn', ...args);
    },
    error: (...args) => {
        _log('error', ...args);
    },
    alert:(...args) => {
        showConfirmModal({
            title:'出错了',
            content:JSON.stringify(args),
            showCancel: false,
        });
        _log('error', args);
    },
};
/**
 * 日志输出方法
 * @param func
 * @param strs
 * @private
 */
 export function _log (func, ...strs) {
    let _console = console;
    let systemInfo = getSystemInfo();
    if (!(systemInfo.system && systemInfo.system.startsWith('9.') && systemInfo.platform == 'iOS')) { // ios9不能console.log.apply
        _console[func].apply(null, [...strs]);
    }
    
    if (getRemoteLogEnabled()) {
        getProxyDeferred().then(() => {
            remoteLogSend({ type:func, content:strs });
        });
    }
    if (LEVELS[func] <= LEVELS[getSettings().proxy.logRecordLevel]) {
        recordLog(func, ...strs);
    }
}
/**
 * remoteLog发送内容
 * @param strs
 */
 export function remoteLogSend (args) {
    proxySend({ category:"LOG", ...args });
}

export const record = {
    log:[],
    actionQueueUploadedLength: 0,
};


export function clearRecordLog () {
    record.log = [];
}
/**
 * 拿到log
 */
export function getLogRecord () {
    return record;
}

/**
 * 记录日志
 * @param level
 * @param args
 */
export function recordLog (level, ...args) {
    record.log.push({ level, content:args });
}