let doll_account = '/Users/feixiaochuan/Documents/project/DollProject/DollAccount.json'  // 账号密钥相关目录
    , dir_project = '/Users/feixiaochuan/Documents/project/DollProject/kuaishoudoll/' // 项目文件目录
    , dir_web = 'bin-release/web/'; // egret发布成功的web文件目录

module.exports = {
    DOLL_ACCOUNT: doll_account,        // 账号密钥相关配置
    DIR_PROJECT: dir_project,           // egret源代码项目目录
    DIR_WEB: dir_project + dir_web,     // egret源代码项目发布后的release目录

    // egret引擎引用的js
    RES_EGRET: {
        src: [
            '/libs/modules/egret/egret.min.js',
            '/libs/modules/egret/egret.web.min.js',
            '/libs/modules/eui/eui.min.js',
            '/libs/modules/game/game.min.js',
            '/libs/modules/res/res.min.js',
            '/libs/modules/tween/tween.min.js'
        ],
        common: 'egret.engine.min.js'
    },
    // 项目所需的类库：【Zepto、sweetalert、... 、WXapi.dev 】inject 进入index.html
    RES_LIBS: {
        src: [
            dir_project + 'libs/zepto.min.js',
            dir_project + 'libs/fastclick.js',
            dir_project + 'libs/sweetalert.min.js',
            dir_project + 'libs/clipboard.min.js',
            dir_project + 'libs/ApiConfig.js',
            dir_project + 'libs/ApiUtils.js',
            dir_project + 'libs/ViewUtils.js',
        ],
        dev: 'vendons.js',       // dev打包下的文件名（不压缩）
        prod: 'vendons.min.js'   // prod打包下的文件名 (压缩)
    },
    // 项目配置文件：针对getAuth.html、weixinAuth.html
    RES_CONFIG: {
        src: [
            dir_project + 'libs/ApiConfig.js'
        ],
        dev: 'config.js',
        prod: 'config.min.js'
    },
    // 项目css文件
    RES_CSS: {
        src: [
            dir_project + 'libs/sweetalert.css'
        ],
        dev: 'modules.css',
        prod: 'modules.min.css'
    },
    // 项目css文件
    RES_CSS_MODULE: {
        src: [
            dir_project + 'libs/style/common.css',
            dir_project + 'libs/style/module.css'
        ]
    },
    // 项目html文件
    RES_HTML: [
        dir_project + 'test.html'
    ],

    // 项目其他文件
    RES_OTHER: [
        dir_project + 'getAuth.html',
        dir_project + 'error.html',
        // dir_project + 'weixinAuth.html',
        // dir_project + 'aliyun.html',
        dir_project + 'favicon.ico',
        dir_project + 'MP_verify_jJkpVZzb8rUQ278p.txt'
    ]
};
