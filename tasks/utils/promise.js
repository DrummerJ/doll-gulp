const Promise = require('bluebird');

/**
 * 串行执行promise队列
 * @param {Array} promiseArr promise队列
 * @param {Boolean} inheritance 是否继承上一个promise的返回值
 */
Promise.series = (promiseArr, inheritance) => {
    return Promise.reduce(promiseArr, (values, promise) => {
        return promise.apply(promise, inheritance ? values : []).then((result) => {
            values.push(result)
            return values
        }).catch((err) => err)
    }, [])
};

module.exports = Promise;