const pth = require('path');
const crypto = require('crypto');
const {PluginError} = require('gulp-util');

module.exports = {
    /**
     * 创建错误信息
     * @param {String} path 插件名称
     * @param {String|Object} err 错误信息
     * @param {String} path 文件路径
     * @returns {PluginError}
     */
    error: function (name, err, path) {
        let msg = err
        const info = {showStack: false}
        if (typeof err === 'object') {
            msg = err.message || err.msg || 'unspecified error'
            info.lineNumber = err.line
            info.stack = err.stack
        }
        if (path) {
            msg = path + ': ' + msg
            info.fileName = pth.parse(path).base
        }
        return new PluginError(name, msg, info)
    },
    /**
     * 格式化文件大小 转换为具体的单位 最大单位g
     * @param {Number} bytes 文件大小 单位byte
     * @param {Number} decimals 保留小时位数 缺省为2
     * @returns {String} 转换后的值
     */
    formatSizeUnits: function (bytes, decimals = 2) {
        if (bytes === 0) return '0 byte'
        const units = ['bytes', 'kb', 'mb', 'g']
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1)
        return parseFloat((bytes / Math.pow(1000, i)).toFixed(decimals)) + ' ' + units[i]
    },
    /**
     * 格式化时间 转换为具体的单位 最大单位h
     * @param {Number} times 时间 单位ms
     * @param {Number} decimals 保留小时位数 缺省为2
     * @returns {String} 转换后的值
     */
    formatTimeUnit: function (times, decimals = 2) {
        if (times < 1000) {
            return times + ' ms'
        } else if (times < 60000) {
            return parseFloat(times / 1000).toFixed(decimals) + ' s'
        } else if (times < 3600000) {
            return parseFloat(times / 60000).toFixed(decimals) + ' m'
        } else {
            return parseFloat(times / 3600000).toFixed(decimals) + ' h'
        }
    },
    /**
     * 按位数生成md5串
     * @param {String|Buffer} data 数据源
     * @param {Number} len 长度, 默认为 7
     * @returns {String} md5串
     */
    md5: function (data, len = 7) {
        const md5sum = crypto.createHash('md5')
        const encoding = typeof data === 'string' ? 'utf8' : 'binary'
        md5sum.update(data, encoding)
        return md5sum.digest('hex').substring(0, len)
    }
};