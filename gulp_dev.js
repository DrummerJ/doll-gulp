let gulp = require('gulp')
    , merge = require('merge-stream')
    , runSequence = require('run-sequence');

let commonTask = require('./tasks/build.common.js');
let devTask = require('./tasks/build.dev.js');
let taskPath = require('./tasks/path');

// dev模式打包代码：不压缩项目js（除egret引擎）、不压缩css、不压缩json、不处理图片
gulp.task('default', function (callback) {
    runSequence(
        ['clean'],
        [
            'copy:res:libs',
            'copy:res:css',
            'copy:res:config',
            'copy:res:other',
            'copy:res:version',
            'mini:res:egret',
            'copy:res:version:resource'
        ],
        ['inline:resource:index.html'],
        ['inject:index.html', 'inject:auth.html'],
        ['open:server'],
        callback
    );
});

// 清除打包文件
gulp.task('clean', commonTask.clean);

// 复制项目下面的libs的公共类库js
gulp.task('copy:res:libs', function (callback) {
    return devTask.copyResLibs(callback)
});

// 复制项目下面的libs的css文件
gulp.task('copy:res:css', function (callback) {
    return devTask.copyResCss(callback)
});

// 复制项目下面的libs的ApiConfig.js
gulp.task('copy:res:config', function (callback) {
    return devTask.copyResConfig(callback)
});

// 复制其他文件
gulp.task('copy:res:other', function (callback) {
    return commonTask.copyResOther(callback)
});

// release版本目录下复制文件：main.min.js、index.html
gulp.task('copy:res:version', function (callback) {
    return commonTask.copyResVersion(commonTask.getVersion().ver);
});

// release版本目录下压缩egret引擎js
gulp.task('mini:res:egret', function (callback) {
    return commonTask.copyResEgretWithVer(commonTask.getVersion().ver);
});

// release版本目录下复制resource资源
gulp.task('copy:res:version:resource', function (callback) {
    return commonTask.copyResWithVerAndDir(commonTask.getVersion().ver, 'resource');
});

// inject插入index.html
gulp.task('inject:index.html', function (callback) {
    runSequence(
        ['replace:index.html'],
        ['inject:index.html:vendons'],
        ['inject:index.html:css'],
        ['inject:index.html:egret'],
        ['inject:index.html:main'],
        callback
    );
});

// 开启服务器
gulp.task('open:server', function () {
    commonTask.openServer();
});

// 替换index.html内联css
gulp.task('inline:resource:index.html', function (callback) {
    return commonTask.inlineSource('index', false);
});

// index.html的替换占位符为需要的资源名称
gulp.task('replace:index.html', function (callback) {
    return commonTask.replaceHtmlWithTag(
        'index',
        devTask.getReplaceResArr()
    );
});

// inject插入index.html的类库vendons js
gulp.task('inject:index.html:vendons', function (callback) {
    let url = `/libs/${taskPath.RES_LIBS.dev}?v=${new Date().getTime()}`;
    return commonTask.injectHtmlWithTag(
        'index',
        url,
        '<!--other_libs_files_start-->',
        '<!--other_libs_files_end-->'
    );
});

// inject插入index.html的css
gulp.task('inject:index.html:css', function (callback) {
    let url = `/libs/${taskPath.RES_CSS.dev}?v=${new Date().getTime()}`;
    return commonTask.injectHtmlWithTag(
        'index',
        url,
        '<!--other_css_files_start-->',
        '<!--other_css_files_end-->',
        {
            style: 2
        }
    );
});

// inject插入index.html的egret js
gulp.task('inject:index.html:egret', function (callback) {
    let url = `/libs/${taskPath.RES_EGRET.common}`;
    return commonTask.injectHtmlWithTag(
        'index',
        url,
        '<!--modules_files_start-->',
        '<!--modules_files_end-->',
        {
            'egret': 'lib'
        }
    );
});

// inject插入index.html的main.min.js
gulp.task('inject:index.html:main', function (callback) {
    let url = `/libs/main.min.js?v=${new Date().getTime()}`;
    return commonTask.injectHtmlWithTag(
        'index',
        url,
        '<!--game_files_start-->',
        '<!--game_files_end-->'
    );
});

// inject插入getAuth.html、weixinAuth.html
gulp.task('inject:auth.html', function (callback) {
    runSequence(
        [
            'inject:getAuth.html:config',
            'inject:weixinAuth.html:config'
        ],
        callback
    );
});

// inject插入getAuth.html的类库config js
gulp.task('inject:getAuth.html:config', function (callback) {
    let url = `/libs/${taskPath.RES_CONFIG.dev}?v=${new Date().getTime()}`;
    return commonTask.injectHtmlWithTag(
        'getAuth',
        url,
        '<!--other_libs_files_start-->',
        '<!--other_libs_files_end-->'
    );
});

// inject插入weixinAuth.html的类库config js
gulp.task('inject:weixinAuth.html:config', function (callback) {
    let url = `/libs/${taskPath.RES_CONFIG.dev}?v=${new Date().getTime()}`;
    return commonTask.injectHtmlWithTag(
        'weixinAuth',
        url,
        '<!--other_libs_files_start-->',
        '<!--other_libs_files_end-->'
    );
});