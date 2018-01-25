let gulp = require('gulp')
    , path = require('path')
    , merge = require('merge-stream')
    , concat = require('gulp-concat');

let taskPath = require('./path')
    , env = require('./env');

module.exports = {
    // 获取index.html插入的占位符对应要替换的字符串
    getReplaceResArr: function () {
        return [
            {
                name: 'skin.name',
                value: env.SKIN
            },
            {
                name: 'skin.title',
                value: env.SKIN_TITLE
            }
        ];
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
    // 复制并合并类库js文件
    copyResLibs: function () {
        return gulp.src(taskPath.RES_LIBS.src)
            .pipe(concat(taskPath.RES_LIBS.dev))
            .pipe(gulp.dest(env.PROJECT_WEB_PATH));
    },
    // 复制并合并css文件
    copyResCss: function () {
        let taskCopyCss = gulp.src(taskPath.RES_CSS.src)
            .pipe(concat(taskPath.RES_CSS.dev))
            .pipe(gulp.dest(env.PROJECT_WEB_PATH));

        let taskMoveInlineCss = gulp.src(taskPath.RES_CSS_MODULE.src)
            .pipe(gulp.dest(path.join(env.PROJECT_WEB_PATH, 'style')));

        return merge(taskCopyCss, taskMoveInlineCss);
    },
    // 复制并合并ApiConfig
    copyResConfig: function () {
        return gulp.src(taskPath.RES_CONFIG.src)
            .pipe(concat(taskPath.RES_CONFIG.dev))
            .pipe(gulp.dest(env.PROJECT_WEB_PATH));
    }
};
