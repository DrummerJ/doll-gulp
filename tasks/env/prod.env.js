var merge = require('webpack-merge');
var baseEnv = require('./base.env');

/**
 * 线上正式环境：cdn走正式Bucket
 */
var envCfg = {
    NODE_ENV: 'prod',
    VERSION_CACHE : 'versionCfg.prod.json',   // 版本缓存json，务删
    ALIYUN: {
        PATH_CDN: 'http://cdn.miso-lab.com',  // CDN的URL
        BUCKET: 'misao-lab',
        REGION: 'oss-cn-hangzhou',
        END_POINT: 'oss-cn-hangzhou.aliyuncs.com'
    }
};
module.exports = merge(baseEnv, envCfg);
