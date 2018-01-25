var merge = require('webpack-merge');
var baseEnv = require('./base.env');

var envCfg = {
    NODE_ENV: 'test',
    VERSION_CACHE : 'versionCfg.test.json',   // 版本缓存json，务删
    ALIYUN: {
        PATH_CDN: 'http://cdn.babiapp.com',  // CDN的URL
        BUCKET: 'ry-wwj-test',
        REGION: 'oss-cn-beijing',
        END_POINT: 'oss-cn-beijing.aliyuncs.com'
    }
};
module.exports = merge(baseEnv, envCfg);
