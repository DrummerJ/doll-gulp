let path = require('path')
    , gulp = require('gulp')
    , del = require('del')
    , merge = require('merge-stream')
    , smushit = require('gulp-smushit')
    , tinypng = require('gulp-tinypng')
    , concat = require('gulp-concat')
    , uglify = require('gulp-uglify')
    , inject = require('gulp-inject')
    , replace = require('gulp-replace-task')
    , browserSync = require('browser-sync').create()
    , minimist = require('minimist')
    , inlineSource = require('gulp-inline-source');

let jsonParse = require('./tools/jsonPlugin');
let taskPath = require('./path');
let env = require('./env');

module.exports = {
    getVersion : function () {
        let originalOptions = {
            string: 'version',
            default: {version: 'v1.0.1'}
        };
        let options = minimist(process.argv.slice(2), originalOptions);
        options.ver = typeof options.ver == 'string' && options.ver ? options.ver : options.version;
        return options;
    },
    // 清理项目文件
    clean: function (callback) {
        return del([env.PROJECT_PATH], callback);
    },

    // 开启服务器
    openServer: function () {
        browserSync.init({
            server: {
                baseDir: env.PROJECT_PATH
            },
            port: 8181
        });
    },

    // 复制WxConfig资源
    copyResConfig: function (callback) {
        return gulp.src(taskPath.RES_CONFIG.src)
            .pipe(gulp.dest(env.PROJECT_PATH));
    },

    // 复制其他静态资源
    copyResOther: function (callback) {
        return gulp.src(taskPath.RES_OTHER)
            .pipe(gulp.dest(env.PROJECT_PATH));
    },

    // 从发布目录下面复制版本资源
    copyResWithVerAndDir: function (version, folder) {
        console.log(taskPath.DIR_WEB + version + '/' + folder + '/**/*')
        return gulp.src([taskPath.DIR_WEB + version + '/' + folder + '/**/*'])
            .pipe(gulp.dest(env.PROJECT_PATH + '/' + folder + '/'));
    },

    // release版本目录下复制引擎文件
    copyResEgretWithVer: function (version) {
        let srcList = taskPath.RES_EGRET.src.map(function (url) {
            return taskPath.DIR_WEB + version + '/' + url
        });
        return gulp.src(srcList)
            .pipe(concat(taskPath.RES_EGRET.common))
            .pipe(uglify())
            .pipe(gulp.dest(env.PROJECT_WEB_PATH));
    },

    // release版本目录下复制需要main.min.js和index.html
    copyResVersion: function (version) {
        let folders = [{
            from: taskPath.DIR_WEB + version + '/index.html',
            dist: path.resolve(env.PROJECT_WEB_PATH, '../')
        }, {
            from: taskPath.DIR_WEB + version + '/main.min.js',
            dist: env.PROJECT_WEB_PATH
        }];

        let tasks = folders.map(function (folder) {
            return gulp.src(folder.from)
                .pipe(gulp.dest(folder.dist));
        });

        return merge(tasks);
    },
    // 压缩folder目录下面的所有json资源
    minifyResourceJson: function (folder) {
        let path = env.PROJECT_PATH + '/' + folder;
        return gulp.src(path + '/**/*.json')
            .pipe(jsonParse())
            .pipe(gulp.dest(path))
            .on("finish", function () {
                console.log("处理JSON完成")
            });
    },

    // 压缩图片资源
    minifyResourceImg: function (folder) {
        let path = env.PROJECT_PATH + '/' + folder;
        // return gulp.src(path + '/**/*.{png,jpg,gif,ico}')
        //     .pipe(smushit({
        //         verbose: true
        //     }))
        //     .pipe(gulp.dest(path))
        //     .on("finish", function () {
        //         console.log("处理Image完成")
        //     });

        // 'L5Iyfv0_IJkc26IFIxfkUcUBmo9bE-xH',
        // 'o3u-F7z6a0Ik2540_f0nyMgauqWGyIUM',
        // 'kcSI-3W3Ktvkl-m6WoGULcrynTA_X6Ig',
        // 'sM5ymb1YuwI5TkFKQNPyiS6t0kMsRT3p'
        // return gulp.src(path + '/**/*.{png,jpg,gif,ico}')
        //     .pipe(tinypng('L5Iyfv0_IJkc26IFIxfkUcUBmo9bE-xH'))
        //     .pipe(gulp.dest(path))
        //     .on("finish", function () {
        //         console.log("处理Image完成")
        //     });

        const tinify = require('./tinify');
        return gulp.src(path + '/**/*.{png,jpg,gif,ico}')
            .pipe(tinify())
            .pipe(gulp.dest(path))
            .on("finish", function () {
                console.log("处理Image完成")
            })
            .on("error", function (error) {
                console.log("error", error)
            });
    },

    injectHtmlWithTag: function (pagesName = 'index', md5Url, startTag, endTag, opts) {
        opts = opts || {};

        let path;
        if (Object.prototype.toString.call(pagesName) === '[object Array]') {
            path = pagesName.map(function (item, index) {
                return `${env.PROJECT_PATH}/${item}.html`;
            });
        } else {
            path = `${env.PROJECT_PATH}/${pagesName}.html`;
        }

        console.log("=====md5Url:"+ md5Url);

        let taskInject = gulp.src(path)
            .pipe(inject(gulp.src(path), {
                starttag: startTag,
                endtag: endTag,
                relative: true,
                transform: function (filePath, file) {
                    let attrStr = '';
                    if (opts.style == 2) {
                        return `<link rel="stylesheet" type="text/css" href="${md5Url}"/>`;
                    } else {
                        for (let key in opts) {
                            if (key != 'style' && opts.hasOwnProperty(key))
                                attrStr += ` ${key}="${opts[key]}"`
                        }
                        return `<script ${attrStr == '' ? '' : attrStr } src="${md5Url}"></script>`;
                    }
                }
            }))
            .pipe(gulp.dest(env.PROJECT_PATH));
        return taskInject;
    },

    replaceHtmlWithTag: function (pagesName, replaceArr) {
        /**
         *
         let path = `${env.PROJECT_PATH}/${pagesName}.html`;
         let taskReplace = gulp.src(path)
         .pipe(replace('%%%res.json%%%','default.fc886a95.thm.json'))   //替换地址
         .pipe(gulp.dest(env.PROJECT_PATH));
         return taskReplace;
         */
        replaceArr = replaceArr || [];
        let patterns = replaceArr.map((item) => {
            return {
                match: item.name,
                replacement: item.value
            }
        });
        let path = `${env.PROJECT_PATH}/${pagesName}.html`;
        let taskReplace = gulp.src(path)
            .pipe(replace({
                patterns: patterns
            }))
            .pipe(gulp.dest(env.PROJECT_PATH));
        return taskReplace;
    }
    , inlineSource: function (pageName, compress) {
        compress = compress || false;
        let path = `${env.PROJECT_PATH}/${pageName}.html`;
        console.log(path)
        let taskInline = gulp.src(path)
            .pipe(inlineSource({
                compress: false
            }))
            .pipe(gulp.dest(env.PROJECT_PATH));
        return taskInline;
    }
};
