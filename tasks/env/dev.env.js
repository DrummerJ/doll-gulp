var merge = require('webpack-merge');
var baseEnv = require('./base.env');

var envCfg = {
    NODE_ENV : 'dev',
    VERSION_CACHE : 'versionCfg.dev.json',   // 版本缓存json，务删
    ALIYUN : {
        PATH_CDN: 'http://cdn.miso-lab.com',  // CDN的URL
        BUCKET: 'misao-lab',
        REGION: 'oss-cn-hangzhou',
        END_POINT: 'oss-cn-hangzhou.aliyuncs.com'
    }
};
module.exports = merge( baseEnv , envCfg );
