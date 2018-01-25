let path = require('path');
let colors = require('colors');
let taskPath = require('../path');

let env = process.env.NODE_ENV || 'staging';
if (!(/^(dev)|(prod)|(test)|(staging)$/).test(env)) {
    console.log(
        '请先设置当前项目的运行环境 ' +
        '\n dev(开发) 或者 prod(生产) 或者 test(dev测试环境) 或者 staging(测试环境/仿真环境)' +
        '\n 设置方式可为设置环境变量 NODE_ENV=环境名称，或者在项目根目录下新建一个.env 文件 在里面写上一行代码 NODE_ENV=环境名称' +
        '\n 格式（环境变量名称=值【没有引号】），比如 NODE_ENV=dev ');
    //process.exit(code)尽可能快的停止node服务
    process.exit(1);
}

let rootPath = path.resolve(__dirname, '../../');
let api = require(taskPath.DIR_PROJECT + '/libs/ApiConfig.js');
let skin = api.ApiConfig.SKIN.toLocaleLowerCase();
let config = {};
switch (env) { //根据环境，将base基础环境变量导入相应文件中
    case 'dev':
        config = require('./dev.env');
        break;
    case 'test':
        config = require('./test.env');
        break;
    case 'prod':
        config = require('./prod.env');
        break;
    case 'staging':
        config = require('./staging.env');
        break;
}

// 皮肤名称
config.SKIN_ORIGIN = api.ApiConfig.SKIN;
config.SKIN_TITLE = api.ApiConfig.APP_NAME;
config.SKIN = skin;

// 设置资源名称
config.RES_JSON = `default.${skin}.res.json`;
config.THM_JSON = `default.thm.json`;

// 映射皮肤对应阿里云cdn
let rewriteAliyunCdn = function () {
    config.ALIYUN.PATH_CDN = config.ALIYUN.PATH_CDN + '/' + skin;
};

// cdn存储的version.json路径
let rewriteVersion = function () {
    config.VERSION_CDN_PATH = config.ALIYUN.PATH_CDN + '/' + 'version.json';
};

// 打包文件根目录（存放所有的打包文件）
let rewriteProjectRoot = function () {
    config.PROJECT_ROOT_PATH = path.join(rootPath, 'build', skin);
};

// 项目打包目录
let rewriteProject = function () {
    config.PROJECT_PATH = path.join(config.PROJECT_ROOT_PATH, 'dist');
};

// 项目打包js、css、json目录
let rewriteWebProject = function () {
    config.PROJECT_WEB_PATH = path.join(config.PROJECT_PATH, config.CODE_DIR);
};

// 项目打包后的resource目录
let rewriteResourceProject = function () {
    config.PROJECT_RESOURCE_PATH = path.join(config.PROJECT_PATH, config.RESOURCE_DIR);
};

// 打包后upload路径
let rewriteUpload = function () {
    config.UPLOAD_PATH = path.join(config.PROJECT_ROOT_PATH, env);
};

// 的背后diff不同文件的路径
let rewriteUploadDiff = function () {
    config.UPLOAD_DIFF_PATH = path.join(config.UPLOAD_PATH, 'diff');
};

// 打包后在diff目录生成的version.json文件
let rewriteUploadDiffVersion = function () {
    config.UPLOAD_VERSION_PATH = path.join(config.UPLOAD_DIFF_PATH, 'version.json');
};

// 打包后all文件的路径
let rewriteUploadAll = function () {
    config.UPLOAD_ALL_PATH = path.join(config.UPLOAD_PATH, 'all');
};

let print = function (cfg, prefix) {
    for (let key in cfg) {
        let item = cfg[key];
        if (Object.prototype.toString.call(item) === "[object Object]") {
            let parent = `${ prefix ? prefix + '.' + key : key }`;
            console.log(parent.red)
            print(item, parent);
        } else {
            console.log(`${ prefix ? prefix + '.' + key : key } = ${cfg[key]}`.green)
        }
    }
};

rewriteAliyunCdn();
rewriteVersion();

rewriteProjectRoot();
rewriteProject();
rewriteWebProject();
rewriteResourceProject();

rewriteUpload();
rewriteUploadDiff();
rewriteUploadDiffVersion();
rewriteUploadAll();
print(config, '');

module.exports = config;