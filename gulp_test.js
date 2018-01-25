// // var gulp = require('gulp');
// // var merge = require('merge-stream');
// // var runSequence = require('run-sequence');
// // var imagemin = require('gulp-imagemin');
// // var pngquant = require('imagemin-pngquant');
// // //确保本地已安装gulp-cache [cnpm install gulp-cache --save-dev]
// // var cache = require('gulp-cache');
//
// // var commonTask = require('./tasks/build.common.js');
//
// // var args = process.argv.slice(2);
// // var version = args[args.length - 1] === '--env' ? 'v1.0.1' : args[args.length - 1];
//
// // gulp.task('test', function (callback) {
// //     runSequence(
// //         [
// //             'mini:resource'
// //         ],
// //         callback);
// // });
//
// // // 清除打包文件
// // gulp.task('clean', commonTask.clean);
//
// // var gulp = require('gulp');
// // var imagemin = require('gulp-imagemin'),
// //     pngquant = require('imagemin-pngquant');
//
// // gulp.task('imagemin', function () {
// //     var taskPath = require('./tasks/path');
// //     var path = './' + taskPath.DIR_BUILD + '/resource';
// //     console.log(path)
// //     return gulp.src(path + '/**/*.png')
// //         .pipe(imagemin({
// //             progressive: true,
// //             use: [pngquant()]
// //         }))
// //         .pipe(gulp.dest('imagemin-dist'));
// // });
//
// // // release版本目录下压缩resource资源
// // gulp.task('mini:resource', ['copy:res:version:resource'], function (callback) {
// //     // 压缩json文件
// //     var taskJson = commonTask.minifyResourceJson('resource');
// //     return taskJson;
//
// //     // 压缩png/jpg资源
// //     var taskPath = require('./tasks/path');
// //     var path = taskPath.DIR_BUILD + '/resource';
// //     var resourcePath = path + '/**/*.{png,jpg,gif,ico}';
// //     console.log(resourcePath);
// //     var taskImage = gulp.src(resourcePath)
// //         .pipe(cache(imagemin({
// //             progressive: true,
// //             svgoPlugins: [{removeViewBox: false}],
// //             use: [pngquant()]
// //         })))
// //         .pipe(gulp.dest(path))
// //         .on("finish", function () {
// //             console.log("处理Image完成")
// //         });
// //     return merge(taskJson, taskImage);
// // });
//
// // // release版本目录下复制resource资源
// // gulp.task('copy:res:version:resource', function (callback) {
// //     return commonTask.copyResWithVerAndDir(version, 'resource');
// // });
// // var fs = require("fs");
// // var files = fs.readdirSync('/Users/feixiaochuan/Documents/project/DollProject/tool-gulp/bigbattle/upload/diff');
// // console.log(files.length)
//
//
// // let processStd = require('./tasks/tools/processStd');
// // processStd([
// //     {
// //         message: '是否自动上传打包文件到阿里云CDN？ y/n ',
// //         positive: {
// //             code: ['y', '1', 'yes', '是'],
// //             callback: function () {
// //                 console.log('你执行了肯定的操作！！');
// //             }
// //         },
// //         negative: {
// //             code: ['n', '0', 'no', '否'],
// //             callback: function () {
// //                 console.log('你执行了否定的操作！！');
// //             }
// //         }
// //     },
// //     {
// //         message: '是否自动同步到FTP目录？ y/n ',
// //         positive: {
// //             code: ['y', '1', 'yes', '是'],
// //             callback: function () {
// //                 console.log('你执行了肯定的操作！！');
// //             }
// //         },
// //         negative: {
// //             code: ['n', '0', 'no', '否'],
// //             callback: function () {
// //                 console.log('你执行了否定的操作！！');
// //             }
// //         }
// //     }
// // ]).init();
//
// var Client = require('ftp'),//安装这个模块
//     path = require('path'),
//     fs = require('fs'),
//     c = new Client();//实例化一个ftp对象
//
// //当ftp连接成功时触发
// c.on('ready', function () {
//     //进度条+1
//     console.log('ready');
//     var tpath = path.resolve(__dirname, '..');
//     console.log(c.list);
//     c.list(function(err, list) {
//         console.log(err)
//         if(err) throw err;
//
//         console.dir(list);
//
//         c.end();
//
//     });
//
// });
// c.on('end', function () {
//     console.log('error')
// });
// c.on('close', function () {
//     console.log('close')
// });
// c.connect({
//     "connTimeout": 10000,
//     "host": '47.96.174.157',
//     "port": 21,
//     "user": 'ftptest',
//     "password": 'ZnRwQHJlYWRy'
// });