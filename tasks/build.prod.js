let gulp = require('gulp')
    , fs = require('fs')
    , path = require('path')
    , uglify = require('gulp-uglify')
    , concat = require('gulp-concat')
    , minifyCss = require('gulp-minify-css')
    , del = require('del')
    , zip = require('gulp-zip')
    , moment = require('moment')
    , vinylPaths = require('vinyl-paths')
    , rename = require("gulp-rename")
    , merge = require('merge-stream')
    , htmlmin = require('gulp-htmlmin')
    , connect = require('gulp-connect');

let taskPath = require('./path');
let env = require('./env');

module.exports = {
    // 获取index.html插入的占位符对应要替换的字符串
    getReplaceResArr: function (fileMD5Map) {
        let replaceArr = []
            , md5PathArr;

        if( !fileMD5Map )
            return replaceArr;

        for( let keyPath in fileMD5Map ){
            let item = fileMD5Map[keyPath];
            let filePathArr = keyPath.split('/');
            let fullName = filePathArr[filePathArr.length - 1];

            if( fullName === env.RES_JSON ){
                md5PathArr = item.md5Url.split('/');
                replaceArr.push({
                    name: 'res.json',
                    value: env.ALIYUN.PATH_CDN + '/' + md5PathArr[md5PathArr.length - 1]
                });
                continue;
            }

            if( fullName === env.THM_JSON ){
                md5PathArr = item.md5Url.split('/');
                replaceArr.push({
                    name: 'thm.json',
                    value: env.ALIYUN.PATH_CDN + '/' + md5PathArr[md5PathArr.length - 1]
                });
            }
        }

        replaceArr.push({
            name: 'skin.name',
            value: env.SKIN
        });

        // 标题
        replaceArr.push({
            name: 'skin.title',
            value: env.SKIN_TITLE
        });

        // 版本
        let versionPath = env.UPLOAD_VERSION_PATH;
        let versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
        replaceArr.push({
            name: 'skin.version',
            value: versionData.version
        });

        return replaceArr;
    },
    // 获取getAuth.html插入的占位符对应要替换的字符串
    getReplaceAuthArr: function () {
        return [
            {
                name: 'skin.title',
                value: env.SKIN_TITLE
            }
        ];
    },
    // 压缩合并类库js文件
    copyResLibs: function () {
        return gulp.src(taskPath.RES_LIBS.src)
            .pipe(concat(taskPath.RES_LIBS.prod))
            // .pipe(gulpif(options.env === 'production', uglify())) // 仅在生产环境时候进行压缩
            .pipe(uglify())
            .pipe(gulp.dest(env.PROJECT_WEB_PATH));
    },
    // 复制并合并压缩css文件
    copyResCss: function () {
        let taskCopyCss = gulp.src(taskPath.RES_CSS.src)
            .pipe(concat(taskPath.RES_CSS.prod))
            .pipe(minifyCss())
            .pipe(gulp.dest(env.PROJECT_WEB_PATH));

        let taskMoveCss = gulp.src(taskPath.RES_CSS_MODULE.src)
            .pipe(gulp.dest(path.join(env.PROJECT_WEB_PATH, 'style')));
        return merge(taskMoveCss, taskCopyCss);
    },
    // 复制并合并ApiConfig
    copyResConfig: function () {
        return gulp.src(taskPath.RES_CONFIG.src)
            .pipe(concat(taskPath.RES_CONFIG.prod))
            .pipe(uglify())
            .pipe(gulp.dest(env.PROJECT_WEB_PATH));
    },
    // 去除所有html中的注释内容
    htmlmin: function () {
        let options = {
            removeComments: true,//清除HTML注释
            collapseWhitespace: true,//压缩HTML
            collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
            removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
            removeScriptTypeAttributes: false,//删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: false,//删除<style>和<link>的type="text/css"
            minifyJS: true,//压缩页面JS
            minifyCSS: true//压缩页面CSS
        };
        return gulp.src(path.join(env.PROJECT_PATH, '**/*.html'))
            .pipe(htmlmin(options))
            .pipe(gulp.dest(env.PROJECT_PATH));
    }
    // 打包完成后删除dist/libs目录（js已经md5上传到cdn，不需要此目录）
    , deleteLibs: function (callback) {
        return del([env.PROJECT_WEB_PATH], callback);
    }
    // 打包完成后删除删除dist/resource(资源已经上传到阿里云cdn)
    , deleteResource: function (callback) {
        // var skin = env.SKIN_ORIGIN.substring(0, 1).toLocaleLowerCase() + env.SKIN_ORIGIN.substring(1);
        // return del([
        //     path.join(env.PROJECT_RESOURCE_PATH, skin),
        //     path.join(env.PROJECT_RESOURCE_PATH, 'skins')
        // ], callback);return
        return del([
            env.PROJECT_RESOURCE_PATH
        ], callback);
    }
    // 所有的操作结束后，进行压缩打包
    , zip: function () {
        let time = `${moment().format('YYYY-MM-DD HH:mm:ss')}`;
        let timeArr = time.split(':');
        let timeName = `${timeArr[0]}时${timeArr[1]}分${timeArr[2]}秒`;
        let timeNameHand = `${env.SKIN_TITLE}-${timeArr[0]}时${timeArr[1]}分${timeArr[2]}秒`;
        let zipName = `${timeName}.zip`;
        let zipPath = path.join(env.PROJECT_ROOT_PATH, env.NODE_ENV, 'zip');
        let tempFilePath = path.join(zipPath, timeNameHand);

        let taskCopyFiles1 = gulp.src(`${env.PROJECT_PATH}/getAuth.html`)
            .pipe(gulp.dest(tempFilePath));

        let taskCopyFiles2 = gulp.src(`${env.PROJECT_PATH}/**/*`)
            .pipe(gulp.dest(path.join(tempFilePath, 'doll')));

        let taskDelGetAuth = gulp.src(path.join(tempFilePath, 'doll', 'getAuth.html'))
            .pipe(vinylPaths(del));

        let taskZip = gulp.src(`${env.PROJECT_PATH}/**/*`)
            .pipe(zip(zipName))
            .pipe(gulp.dest(zipPath));

        return merge(taskCopyFiles1, taskCopyFiles2, taskDelGetAuth, taskZip);
    }
    , connectServer: function () {
        connect.server({
            name: '娃娃机',
            root: './bigBattle/dist',
            port: 3000,
            livereload: true
        });
    }
};
