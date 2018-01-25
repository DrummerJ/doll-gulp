let gulp = require('gulp');
let runSequence = require('run-sequence');
let commonTask = require('./tasks/build.common.js');

let args = process.argv.slice(2);
let version = args[args.length - 1] === '--env' ? 'v1.0.1' : args[args.length - 1];


gulp.task('imagemin', function (callback) {
    runSequence(
        [
            'mini:resource'
        ],
        callback);
    callback();
});

// 清除打包文件
gulp.task('clean', commonTask.clean);

// release版本目录下压缩resource资源
gulp.task('mini:resource', function (callback) {
    return commonTask.minifyResourceImg('resource');
});

// release版本目录下压缩resource资源
gulp.task('mini:copy:resource', ['copy:res:version:resource'], function (callback) {
    return commonTask.minifyResourceImg('resource');
});

// release版本目录下复制resource资源
gulp.task('copy:res:version:resource', function (callback) {
    return commonTask.copyResWithVerAndDir(version, 'resource');
});