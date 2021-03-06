const commonEvents = {
    userInfoCallback: {},  // 获取用户信息后的回调
    loading: {},
};

export const events = {
    ...commonEvents,
    subscribe: (eventName, callback) => {
        const eventItem = events[eventName];
        if (eventItem) {
            eventItem.callbackPool.push(callback);
        }
    },
    subscribeOnce: (eventName, callback) => {
        const eventItem = events[eventName];
        if (eventItem) {
            eventItem.callbackOnce = callback;
        }
    },
    unsubscribe: (eventName, callback) => {
        const eventItem = events[eventName];
        if (eventItem) {
            const index = eventItem.callbackPool.findIndex(callback);
            eventItem.callbackPool.splice(index, 1);
        }
    },
    emit: (eventName, args) => {
        const eventItem = events[eventName];
        if (eventItem) {
            eventItem.beforeEmit && eventItem.beforeEmit();
            (typeof eventItem.callbackOnce === 'function') && eventItem.callbackOnce(args);
            eventItem.callbackPool.map((callback) => {
                callback(args);
            });
            eventItem.afterEmit && eventItem.afterEmit();
        }
    },
};
/**
 * 初始化eventManager 把上面的对象一个一个的添加上
 * subscribe 订阅事件
 * subscribeOnce 订阅且只订阅一次
 * emit 触发事件
 * unsubscribe 取消订阅事件
 这几个方法
 */
Object.keys(events).map((key) => {
    const eventItem = events[key];
    eventItem.callbackPool = [];
    eventItem.subscribe = events.subscribe.bind(eventItem, key);
    eventItem.subscribeOnce = events.subscribeOnce.bind(eventItem, key);
    eventItem.unsubscribe = events.unsubscribe.bind(eventItem, key);
    eventItem.emit = events.emit.bind(eventItem, key);
});
