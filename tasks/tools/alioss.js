let fs = require('fs')
    , path = require('path')
    , colors = require('colors')
    , glob = require("glob")
    , co = require('co')
    , OSS = require('ali-oss');

let env = require('../env')
    , pathCfg = require('../path');
let Aliyun = {
    _client: null
    , init: function () {
        let accountJson = require(pathCfg.DOLL_ACCOUNT);
        this.client = new OSS({
            region: env.ALIYUN.REGION,
            accessKeyId: accountJson.cdn.accessKeyId,
            accessKeySecret: accountJson.cdn.accessKeySecret,
        });
    }
    , uploadNew: function* () {
        Aliyun.init();
        return co(function* () {
            let result = yield Aliyun.client.listBuckets({
                prefix: env.ALIYUN.BUCKET
            });

            if (!result)
                console.log('上传失败，阿里云CDN上没有名为ry-wwj-test的Buckets！！！！');

            let results = []
                , diffFilesPath = env.UPLOAD_DIFF_PATH
                , diffFileList = fs.readdirSync(diffFilesPath)
                , cdnFolderArr = env.ALIYUN.PATH_CDN.split('/')
                , cdnFolder = cdnFolderArr[cdnFolderArr.length - 1]
                , uploadIndex = 0;

            if (diffFileList.length <= 1 ) {
                console.log('没有上传的文件~~~~'.red);
                return;
            }

            diffFileList.forEach((name) => {
                let fPath = path.join(diffFilesPath, name);
                let stats = fs.statSync(fPath);
                if (stats.isFile()) {
                    let defer = co(function* () {
                        // 阿里云 上传文件
                        // 1、useBucket
                        Aliyun.client.useBucket(env.ALIYUN.BUCKET);
                        // 2、上传文件
                        let result = yield Aliyun.client.put(path.join(cdnFolder, name), fPath);
                        // 3、上传之后删除本地文件
                        // fs.unlinkSync(localFile);
                        uploadIndex++;
                        console.log(JSON.stringify({
                            msg: `上传成功【${uploadIndex}】`,
                            fileCDNPath: `${env.ALIYUN.PATH_CDN}/${name}`
                        }).green);
                        return result;

                    }).catch(function (err) {
                        // 上传之后删除本地文件
                        // fs.unlinkSync(localFile);
                        console.log(JSON.stringify({msg: '上传失败', error: JSON.stringify(err)}).red);
                    });
                    results.push(defer);
                }
            });
            yield results;
        }).catch(function (err) {
            console.log(err);
        });
    }
    // , upload: (callback) => {
    //     this.init();
    //     co(function* () {
    //         let result = yield Aliyun.client.listBuckets({
    //             prefix: env.ALIYUN.BUCKET
    //         });
    //         if (result !== null) {
    //             let diffPath = env.UPLOAD_DIFF_PATH;
    //             let files = fs.readdirSync(diffPath);
    //             this._uploadNum = 0;
    //             files.forEach((name) => {
    //                 let fPath = path.join(diffPath, name);
    //                 let stats = fs.statSync(fPath);
    //                 if (stats.isFile()) {
    //                     let ext = path.extname(fPath);
    //                     console.log('/mytest/' + name);
    //
    //                     co(function* () {
    //                         // 阿里云 上传文件
    //                         // 1、useBucket
    //                         Aliyun.client.useBucket(env.ALIYUN.BUCKET);
    //                         // 2、上传文件
    //                         let result = yield Aliyun.client.put('/mytest/' + name, fPath);
    //                         // 3、上传之后删除本地文件：fs.unlinkSync(localFile);
    //
    //                         console.log(JSON.stringify({
    //                             msg: '上传成功' + this._uploadNum,
    //                             fileCDNPath: path.join(env.ALIYUN.PATH_CDN, result.name)
    //                         }).green);
    //                         this._uploadNum++;
    //
    //                         if (this._uploadNum === files.length) {
    //                             typeof callback === 'function' && callback();
    //                             return 'end';
    //                         }
    //                     }).catch(function (err) {
    //                         // 上传之后删除本地文件：fs.unlinkSync(localFile);
    //                         console.log(JSON.stringify({msg: '上传失败', error: JSON.stringify(err)}).red);
    //                     });
    //                 }
    //             });
    //             console.log('上传完成！！！！')
    //         } else {
    //             console.log('上传失败，阿里云CDN上没有名为ry-wwj-test的Buckets！！！！');
    //         }
    //     }).catch(function (err) {
    //         console.log(err);
    //     });
    // }
    // , uploadFile: function* (diffPath, name) {
    //     let fPath = path.join(diffPath, name);
    //     let stats = fs.statSync(fPath);
    //     if (stats.isFile()) {
    //         let ext = path.extname(fPath);
    //         console.log(fPath.green + '=== ' + name);
    //         // 阿里云 上传文件
    //         co(function* () {
    //             // 1、useBucket
    //             Aliyun.client.useBucket(env.ALIYUN.BUCKET);
    //             // 2、上传文件
    //             let result = yield Aliyun.client.put(name, fPath);
    //             // 3、上传之后删除本地文件：fs.unlinkSync(localFile);
    //
    //             let fileCDNPath = path.join(env.ALIYUN.PATH_CDN, result.name);
    //             console.log(JSON.stringify({msg: '上传成功', fileCDNPath: fileCDNPath}).green);
    //         }).catch(function (err) {
    //             // 上传之后删除本地文件：fs.unlinkSync(localFile);
    //             console.log(JSON.stringify({msg: '上传失败', error: JSON.stringify(err)}).red);
    //         });
    //     }
    //
    //     return 'ok';
    // }
};

module.exports = Aliyun;