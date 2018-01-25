var merge = require('webpack-merge');
var baseEnv = require('./base.env');

/**
 * 外网测试环境：cdn走测试Bucket  staging server为production环境的镜像
 */
var envCfg = {
    NODE_ENV: 'staging',
    VERSION_CACHE : 'versionCfg.staging.json',   // 版本缓存json，务删
    ALIYUN: {
        PATH_CDN: 'http://cdn.babiapp.com',  // CDN的URL
        BUCKET: 'ry-wwj-test',
        REGION: 'oss-cn-beijing',
        END_POINT: 'oss-cn-beijing.aliyuncs.com'
    }
};
module.exports = merge(baseEnv, envCfg);
