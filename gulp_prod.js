let gulp = require('gulp')
    , merge = require('merge-stream')
    , runSequence = require('run-sequence')
    , rename = require("gulp-rename")
    , del = require('del')
    , vinylPaths = require('vinyl-paths')
    , co = require('co');

let commonTask = require('./tasks/build.common.js');
let prodTask = require('./tasks/build.prod.js');
let cdnMD5 = require('./tasks/tools/cdnMD5');
let taskPath = require('./tasks/path');
let env = require('./tasks/env');
let processStd = require('./tasks/tools/processStd');
let Aliyun = require('./tasks/tools/alioss');

let fileMD5Map;
gulp.task('default', function (callback) {
    runSequence(
        ['clean'],
        [
            'copy:res:other',
            'copy:res:libs',
            'copy:res:config',
            'copy:res:css',
            'copy:res:version',
            'mini:res:egret',
            'mini:resource'
        ],
        ['inline:resource:index.html'],
        ['md5:cdn:file'],
        // ['rename:file:type2'],
        ['inject:index.html', 'inject:auth.html'],
        ['replace:getAuth.html'],
        ['htmlmin:html'],
        ['prod:del:libs', 'prod:del:resource'],
        ['prod:zip'],
        ['prod:process:std'],
        callback
    );
});

// 清除打包文件
gulp.task('clean', commonTask.clean);

// 复制项目下面的libs的公共类库js
gulp.task('copy:res:libs', function (callback) {
    return prodTask.copyResLibs(callback)
});

// 复制项目下面的libs的css文件
gulp.task('copy:res:css', function (callback) {
    return prodTask.copyResCss(callback)
});

// 复制项目下面的libs的wxConfig.js
gulp.task('copy:res:config', function (callback) {
    return prodTask.copyResConfig(callback)
});

// 复制其他不处理文件
gulp.task('copy:res:other', function (callback) {
    return commonTask.copyResOther(callback)
});

// 复制版本文件：main.min.js、index.html
gulp.task('copy:res:version', function (callback) {
    return commonTask.copyResVersion(commonTask.getVersion().ver);
});

// 压缩egret引擎js
gulp.task('mini:res:egret', function ( callback ) {
    return commonTask.copyResEgretWithVer(commonTask.getVersion().ver);
});

// release版本目录下复制resource资源
gulp.task('copy:res:version:resource', function (callback) {
    return commonTask.copyResWithVerAndDir(commonTask.getVersion().ver, 'resource');
});

// release版本目录下压缩resource资源
gulp.task('mini:resource', ['copy:res:version:resource'], function ( callback ) {
    // 压缩json文件
    let taskJson = commonTask.minifyResourceJson('resource');
    if (env.NODE_ENV === 'prod') {
        // 压缩png/jpg资源
        let taskImage = commonTask.minifyResourceImg('resource');
        return merge(taskJson, taskImage);
    } else {
        return taskJson;
    }
});

// 替换index.html内联css
gulp.task('inline:resource:index.html', function (callback) {
    return commonTask.inlineSource('index', true);
});

// 读取cdn文件和本地文件做对比
gulp.task('md5:cdn:file', function (callback) {
    cdnMD5.run((fileMap) => {
        fileMD5Map = fileMap;
        callback();
    });
});

// 写入rulesCfg类型为2的文件
gulp.task('rename:file:type2', function (callback) {
    let tasks = [];
    let task1;
    let task2;
    for (let key in fileMD5Map) {
        if (fileMD5Map.hasOwnProperty(key)) {
            let item = fileMD5Map[key];
            console.log(item);
            if (item.type == 2) {
                let keyArr = key.split('/');
                let path = keyArr.slice(0, keyArr.length - 1).join('/');

                let fullname = keyArr[keyArr.length - 1];
                let name = fullname.replace(new RegExp(item.ext + '$'), '');
                let fileName = `${name}.${item.md5}${item.ext}`;

                /*let src = `${taskPath.DIR_BUILD}${key}`;
                let dist = `${taskPath.DIR_BUILD}${path}`;*/
                task1 = gulp.src(src)
                    .pipe(rename(fileName))
                    .pipe(gulp.dest(dist));

                task2 = gulp.src(src)
                    .pipe(gulp.dest(dist))
                    .pipe(vinylPaths(del));

                tasks.push(task1);
                tasks.push(task2);
            }
        }
    }

    if (tasks.length)
        return merge(tasks);
    else {
        callback();
    }
});

// inject插入html
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

// index.html的替换占位符为需要的资源名称
gulp.task('replace:index.html', function (callback) {
    return commonTask.replaceHtmlWithTag(
        'index',
        prodTask.getReplaceResArr(fileMD5Map)
    );
});

// inject插入index.html的类库vendons js
gulp.task('inject:index.html:vendons', function (callback) {
    let key = `/libs/${taskPath.RES_LIBS.prod}`;
    let md5Url = fileMD5Map[key].md5Url;
    return commonTask.injectHtmlWithTag(
        'index',
        md5Url,
        '<!--other_libs_files_start-->',
        '<!--other_libs_files_end-->'
    );
});

// inject插入index.html的css
gulp.task('inject:index.html:css', function (callback) {
    let key = `/libs/${taskPath.RES_CSS.prod}`;
    let md5Url = fileMD5Map[key].md5Url;
    return commonTask.injectHtmlWithTag(
        'index',
        md5Url,
        '<!--other_css_files_start-->',
        '<!--other_css_files_end-->',
        {
            style: 2
        }
    );
});

// inject插入index.html的egret js
gulp.task('inject:index.html:egret', function (callback) {
    let key = `/libs/${taskPath.RES_EGRET.common}`;
    let md5Url = fileMD5Map[key].md5Url;
    return commonTask.injectHtmlWithTag(
        'index',
        md5Url,
        '<!--modules_files_start-->',
        '<!--modules_files_end-->',
        {
            'egret': 'lib'
        }
    );
});

// inject插入index.html的main.min.js
gulp.task('inject:index.html:main', function (callback) {
    let key = '/libs/main.min.js';
    let md5Url = fileMD5Map[key].md5Url;
    return commonTask.injectHtmlWithTag(
        'index',
        md5Url,
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

// index.html的替换占位符为需要的资源名称
gulp.task('replace:getAuth.html', function (callback) {
    return commonTask.replaceHtmlWithTag(
        'getAuth',
        prodTask.getReplaceAuthArr()
    );
});

// inject插入getAuth.html的类库config js
gulp.task('inject:getAuth.html:config', function (callback) {
    let key = `/libs/${taskPath.RES_CONFIG.prod}`;
    let md5Url = fileMD5Map[key].md5Url;
    return commonTask.injectHtmlWithTag(
        'getAuth',
        md5Url,
        '<!--other_libs_files_start-->',
        '<!--other_libs_files_end-->'
    );
});

// inject插入weixinAuth.html的类库config js
gulp.task('inject:weixinAuth.html:config', function (callback) {
    let key = `/libs/${taskPath.RES_CONFIG.prod}`;
    let md5Url = fileMD5Map[key].md5Url;
    return commonTask.injectHtmlWithTag(
        'weixinAuth',
        md5Url,
        '<!--other_libs_files_start-->',
        '<!--other_libs_files_end-->'
    );
});

// 对index.html去除注释
gulp.task('htmlmin:html', function (callback) {
    return prodTask.htmlmin();
});

// 删除dist目录下面的libs目录及其所有文件
gulp.task('prod:del:libs', prodTask.deleteLibs);

// 删除dist目录下面的resource目录及其所有文件
gulp.task('prod:del:resource', prodTask.deleteResource);

// 对最终dist目录下面的文件打包
gulp.task('prod:zip', function (callback) {
    return prodTask.zip(callback);
});

// 给出选择提示确认
gulp.task('prod:process:std', function (callback) {

    processStd([
        {
            message: '是否自动上传打包文件到阿里云CDN？ y/n ',
            positive: function* () {
                return co(Aliyun.uploadNew).then(() => {
                    callback();
                })
            },
            negative: function () {
                callback();
            }
        },
        {
            message: '是否自动开启浏览器？ y/n ',
            positive: function () {
                commonTask.openServer();
            }
        }
    ]).init();
});

// 开启服务器
gulp.task('open:server', function () {
    return commonTask.openServer();
});