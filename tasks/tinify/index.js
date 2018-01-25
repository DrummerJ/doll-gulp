const pth = require('path');
const fs = require('fs');
const {Buffer} = require('buffer');
const through = require('through2');
const request = require('request');
const tinify = require('tinify');
const {log, colors} = require('gulp-util');
const Promise = require('../utils/promise');
const utils = require('../utils/utils');

const PLUGIN_NAME = 'gulp-project.tinify';
const AUTH_TOKEN = {};

/**
 * 获取当前token当月已使用次数
 * @param token
 * @returns {Promise}
 */
function compressionCount(token) {
    return new Promise(function (resolve, reject) {
        request({
            url: 'https://api.tinypng.com/shrink',
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + (new Buffer.from('api:' + token)).toString('base64') // eslint-disable-line new-cap
            }
        }, function (err, res, body) {
            if (err || JSON.parse(body).error === 'Unauthorized') {
                reject(err || 'invalid token: ' + token)
            } else {
                log('Use the Count', colors.cyan(token), colors.green(res.caseless.dict['compression-count']))
                AUTH_TOKEN[token] = res.caseless.dict['compression-count']
                resolve()
            }
        })
    })
}

/**
 * 获取可用的token
 * @param {Array} tokens
 * @returns {Promise}
 */
function getAvailableToken(tokens) {
    return new Promise(function (resolve, reject) {
        function _() {
            for (const token in AUTH_TOKEN) {
                if (AUTH_TOKEN[token] < 480) {
                    return resolve(token)
                }
            }
            reject(new Error('There is no available token'))
        }

        if (Object.keys(AUTH_TOKEN).length === 0) {
            const promises = []
            const startTime = Date.now()
            log('Starting', `'${colors.cyan('check token')}'...`)

            for (const token of tokens) {
                promises.push(compressionCount(token))
            }

            Promise.all(promises).then(function () {
                log('Finished', colors.cyan('check token'), 'after', colors.magenta(utils.formatTimeUnit(Date.now() - startTime)))
                _()
            }).catch(reject) // 并行执行
        } else {
            _()
        }
    })
}

/**
 * 压缩图片 只支持png和jpg
 * @param {Object} file
 * @param {String} token
 * @returns {Promise}
 */
function compressionFile(file, token) {
    const startTime = Date.now()
    return new Promise(function (resolve, reject) {
        tinify.key = token
        tinify.fromBuffer(file.contents).toBuffer(function (err, data) {
            if (err) {
                reject(err)
            } else {
                AUTH_TOKEN[token] = tinify.compressionCount // 更新使用次数
                log('Compression', colors.cyan(pth.basename(file.path)), 'after', colors.magenta(utils.formatTimeUnit(Date.now() - startTime)), colors.green(`${utils.formatSizeUnits(file.contents.length)} -> ${utils.formatSizeUnits(data.length)}`))
                resolve(data)
            }
        })
    })
}

module.exports = function (tokens = ['L5Iyfv0_IJkc26IFIxfkUcUBmo9bE-xH', 'o3u-F7z6a0Ik2540_f0nyMgauqWGyIUM', 'kcSI-3W3Ktvkl-m6WoGULcrynTA_X6Ig', 'sM5ymb1YuwI5TkFKQNPyiS6t0kMsRT3p']) {
    tokens = tokens instanceof Array ? tokens : [tokens]

    let cache = {}
    const cacheFilePath = pth.join(process.cwd(), 'compression-lock.json')

    // 读取缓存 如果格式错误会重置
    if (fs.existsSync(cacheFilePath)) {
        try {
            cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'))
            // 检测文件路径是否发生变化
            for (let key in cache) {
                if (!fs.existsSync(pth.join(process.cwd(), key))) {
                    delete cache[key]
                }
            }
        } catch (e) {
            cache = {}
        }
    }

    return through.obj(function (file, enc, cb) {
        if (file.isBuffer() && /\.(jpe?g|png)$/.test(file.path)) {
            const relative = pth.relative(process.cwd(), file.path)

            // 判断md5戳确定文件是否被压缩过 如果已经被压缩就不在处理
            if (cache[relative] === utils.md5(file.contents, 12)) return cb(null, file)

            // 压缩图片
            Promise.series([
                getAvailableToken.bind(null, tokens),
                compressionFile.bind(null, file)
            ], true).then((res) => {
                cache[relative] = utils.md5(res[1], 12) // 存储缓存
                fs.writeFileSync(file.path, res[1]) // 替换原文件
                file.contents = res[1]
                fs.writeFileSync(cacheFilePath, JSON.stringify(cache)) // 每次处理完都将保存压缩信息
                this.push(file)
                cb()
            }).catch((err) => {
                this.emit('error', utils.error(PLUGIN_NAME, err))
                cb()
            })
        } else {
            cb(null, file)
        }
    })
};