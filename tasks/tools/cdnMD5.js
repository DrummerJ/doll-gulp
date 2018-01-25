let fs = require('fs')
    , fsExtra = require('fs-extra')
    , crypto = require('crypto')
    , crc = require('crc')
    , path = require('path')
    , glob = require("glob")
    , colors = require('colors')
    , gutil = require('gulp-util')
    , Promise = require('bluebird');

let env = require('../env')
    , request = require('./request')
    , rulesCfg = require('./md5Rules');

let checkFiles = {
    defaultVersion : '1.0.00',
    _cdnVersion: null,
    _uploadCDNVersion: null,
    _fileMD5Map: {},
    _fileContentMap: {},
    _uploadMap: {},
    // 获取MD5码
    getMD5: function (content) {
        // let md5 = crypto.createHash('md5');
        // md5.update(content);
        // return md5.digest('hex');
        return crc.crc32(content).toString(16);
    },
    // 打印对象
    printObj: function (obj) {
        let hasPrint = false;
        for (let key in obj) {
            process.stdout.write(key + ' = '.red + JSON.stringify(obj[key]));
            process.stdout.write('\n');
            hasPrint = true;
        }
        if (!hasPrint) {
            console.log(obj);
        }
    },
    printColor: function (message, colorFunc) {
        colorFunc = typeof colorFunc == 'function' ? colorFunc : gutil.colors.white;
        console.log(colorFunc(message));
    },
    // 生成最新的版本号
    createNewestVersion: function (cacheData) {
        if (cacheData == null || typeof cacheData != 'object')
            return this.defaultVersion;

        let versionArr = []
            , verNum
            , versionKey;
        for (versionKey in cacheData) {
            if (cacheData.hasOwnProperty(versionKey)) {
                verNum = this.versionStr2Num(versionKey);
                versionArr.push(verNum);
            }
        }

        if (versionArr.length == 0)
            return this.defaultVersion;

        versionArr = versionArr.sort(function (a, b) {
            return b - a
        });

        let maxVerNum = versionArr[0];
        return this.versionNum2Str(maxVerNum + 1);
    },

    // 版本字符串转换成数字
    versionStr2Num: function (versionStr) {
        return parseInt(versionStr.split('.').join(''));
    },

    // 数字版本号转成字符串
    versionNum2Str: function (versionNum) {
        let one = Math.floor(versionNum / 1000)
            , two = Math.floor(versionNum / 100) % 10
            , end = Math.floor(versionNum % 100);
        return `${one}.${two}.${end < 10 ? '0' + end : end}`
    },

    getFullName: function (filePath) {
        let filePathArr = filePath.split('/');
        return filePathArr[filePathArr.length - 1];
    },

    getRelativePath: function (filePath) {
        let filePathArr = filePath.split('/');
        return filePathArr.slice(0, filePathArr.length - 1).join('/')
    },
    /**
     *
     * @param filePath 文件相对路径   /resource/bigBattle/atlas/game_new.json
     * @param item  { md5 , ext , type , crc }
     */
    getFileNameWithItem: function (filePath, item) {
        let fullname = this.getFullName(filePath);
        let extractExtArr = ['.min.js', '.min.css', '.res.json', '.thm.json'];
        let filterExtArr = extractExtArr.filter((item) => {
            return fullname.endsWith( item );
        } );
        let extname;
        if( filterExtArr.length )
            extname = filterExtArr[0];
        else
            extname = item.ext;
        let name = fullname.replace(new RegExp(extname + '$'), '');
        return `${name}.${item.md5}${extname}`;
    },
    // 1、获取CDN版本号，cdn不存在或者不能转成{version:xxx}即表示为不存在
    getCDNVersion: function () {
        let cdn_url = `${env.VERSION_CDN_PATH}?v=${new Date().getTime()}`;
        console.log(cdn_url);
        return new Promise((resolve, reject) => {
            request.requestFileUrl(cdn_url, (status, ret) => {
                if (status == 1) {
                    let versionCfg;
                    try {
                        versionCfg = JSON.parse(ret);
                        this._cdnVersion = versionCfg.version;
                        this.printColor(`【 1、CDN版本为：${this._cdnVersion ? this._cdnVersion : '暂无！！'} 】`, gutil.colors.red);
                        resolve(versionCfg);
                    } catch (err) {
                        this._cdnVersion = this.defaultVersion;
                        resolve();
                    }
                } else {
                    this.printColor(`【 第一次创建 】`, gutil.colors.red);
                    this._cdnVersion = '1.0.05';
                    resolve();
                    // reject(ret);
                }
            });
        });
    },

    // 获取md5Rules.js文件所配置的匹配规则，进行遍历生成文件对应的MD5信息
    getRulesFilesMD5: function () {
        return new Promise((resolve, reject) => {
            let cdnRegularRules = rulesCfg.rules
                , resPath;
            this.printColor('【 1.1、匹配规则列表：】', gutil.colors.red);
            console.log(cdnRegularRules);
            cdnRegularRules.forEach((item) => {
                resPath = path.join(env.PROJECT_PATH, item.src);
                // 遍历获取到的文件列表（包括目录）
                let fileList = glob.sync(resPath);
                if (fileList == null) {
                    reject();
                } else {
                    fileList.forEach((filepath) => {
                        let statInfo = fs.lstatSync(filepath);
                        if (!statInfo.isDirectory()) {
                            // 扩展名
                            let extName = path.extname(filepath);
                            if (extName !== '.exml') {
                                let content = fs.readFileSync(filepath, 'utf-8');
                                // MD5码
                                let md5 = this.getMD5(content);
                                // 文件路径名（相对于env.PROJECT_PATH）
                                let fileNamePath = filepath.replace(env.PROJECT_PATH, "");
                                // console.log(`MD5码: ${md5} =扩展名：${extName}= ${fileNamePath} `);
                                this._fileMD5Map[fileNamePath] = {
                                    'md5': md5,
                                    'ext': extName,
                                    'type': item.type,
                                    'crc': crc.crc32(content).toString(16)
                                };
                                // this._fileContentMap[fileNamePath] = content;
                            }
                        }
                    });
                }
            });
            this.printColor('【 2、本地规则匹配的文件的MD5配置：】', gutil.colors.red);
            this.printObj(this._fileMD5Map);

            resolve();
        });
    },
    cacheVersion: function () {
        return new Promise((resolve, reject) => {
            let cacheJsonPath = path.join(env.PROJECT_ROOT_PATH, env.VERSION_CACHE)
                , content;
            // 读取VersionCache.json里面的缓存数据，文件不存在或者读取不到内容，默认为{}
            if (!fs.existsSync(cacheJsonPath)) {
                content = JSON.stringify({});
                fs.writeFileSync(cacheJsonPath, {});
            } else {
                content = fs.readFileSync(cacheJsonPath, 'utf-8') || JSON.stringify({});
            }
            try {
                let cacheData = JSON.parse(content)
                    , cdnVersion = this._cdnVersion
                    , newVersion;
                // 判断cdn版本是否存在
                if (cdnVersion) {
                    // 遍历本地规则文件的md5，与cdn的版本规则今夕对比
                    let cacheJsonMap = cacheData[cdnVersion];
                    this.printColor(`【 3、读取缓存CDN v${cdnVersion}的md5集：】`, gutil.colors.red);
                    console.log(cacheJsonMap);
                    if (!cacheJsonMap) {
                        // cdn版本的缓存本地缺少，重写新版本
                        this._uploadMap = this._fileMD5Map;
                    } else {
                        // 遍历本地规则文件的md5，与cdn的版本规则进行对比
                        let rulesJsonMap = this._fileMD5Map
                            , keyPath
                            , item;
                        for (keyPath in rulesJsonMap) {
                            item = rulesJsonMap[keyPath];
                            // 如果缓存的json里面没有key这个或者md5不相等，表示是新文件，加入uploadMap
                            if (!cacheJsonMap[keyPath] || cacheJsonMap[keyPath].md5 != item.md5) {
                                console.log(`${item.md5} === ${keyPath}  新文件`.green);
                                this._uploadMap[keyPath] = item;
                            }
                        }
                    }

                    // 获取下一个版本后重写版本缓存
                    newVersion = this.versionNum2Str(this.versionStr2Num(cdnVersion) + 1);
                    cacheData[newVersion] = this._fileMD5Map;
                    fs.writeFileSync(cacheJsonPath, JSON.stringify(cacheData));
                    this._uploadCDNVersion = newVersion;

                    this.printColor(`【 3.1、添加v${newVersion}本地缓存，更新CDN版本为${this._uploadCDNVersion}，重新缓存MD集 】`, gutil.colors.red);
                    this.printObj(this._fileMD5Map);
                } else {
                    this._uploadMap = this._fileMD5Map;

                    // 获取最新版本后重写最新版本缓存
                    newVersion = this.createNewestVersion(cacheData);
                    cacheData[newVersion] = this._fileMD5Map;
                    fs.writeFileSync(cacheJsonPath, JSON.stringify(cacheData));
                    this._uploadCDNVersion = newVersion;

                    this.printColor(`【 3、cdn版本获取失败，写入最新v${newVersion}的MD5缓存集 】`, gutil.colors.red);
                    this.printObj(this._fileMD5Map);
                }
                this.printColor("【 4、本地与cdn配置比较后的文件集为：】", gutil.colors.red);
                this.printObj(this._uploadMap);
                resolve();

            } catch (err) {
                this.printColor("versionConfig.json解析出现异常：" + err, gutil.colors.red);
                reject();
            }
        });
    },

    copyAndRenameFiles: function () {
        return new Promise((resolve, reject) => {
            // 移除upload目录
            fsExtra.removeSync(env.UPLOAD_ALL_PATH);
            fsExtra.removeSync(env.UPLOAD_DIFF_PATH);

            /*// copy all目录文件
            console.log('【 5、copy all目录文件 】'.red);
            this.printObj(this._fileMD5Map);
            let item
                , fileName
                , dist
                , src
                , keyPath;
            for (keyPath in this._fileMD5Map) {
                item = this._fileMD5Map[keyPath];
                fileName = this.getFileNameWithItem(keyPath, item);
                src = path.join(env.PROJECT_PATH, keyPath);  // xxx/resource/bigBattle/atlas/game_new.json
                dist = path.join(env.UPLOAD_ALL_PATH, fileName);
                //fs.writeFileSync(dist, this._fileContentMap[keyPath]);
                fsExtra.copySync(src, dist);
            }

            // copy diff目录文件
            console.log('【 6、copy diff目录文件 】'.red);
            this.printObj(this._uploadMap);
            for (keyPath in this._uploadMap) {
                item = this._uploadMap[keyPath];
                if (item.type == 1){
                    fileName = this.getFileNameWithItem(keyPath, item);
                    src = path.join(env.PROJECT_PATH, keyPath);
                    dist = path.join(env.UPLOAD_DIFF_PATH, fileName);
                    // fs.writeFileSync(dist, this._fileContentMap[keyPath]);
                    fsExtra.copySync(src, dist);
                }
            }*/

            // 写入版本到diff
            if (this._uploadCDNVersion) {
                dist = env.UPLOAD_VERSION_PATH;
                let versionData = {
                    version: this._uploadCDNVersion
                };
                fsExtra.outputFileSync(dist, JSON.stringify(versionData));
                this.printColor(`【 7、write diff目录版本文件 ${JSON.stringify(versionData)}】`, gutil.colors.red);
            }

            resolve();
        });
    },

    // 处理resource文件夹下面的文件
    modifyResourceFiles: function () {
        this._number = 0;
        return new Promise((resolve, reject) => {
            this.printObj(this._fileMD5Map);
            let item
                , extName
                , fileName
                , fileMD5Name
                , fileRelPath
                , src
                , dist
                , dist_diff
                , dist_all
                , keyPath;

            // keyPath: /resource/bigBattle/atlas/game_new.json
            for (keyPath in this._fileMD5Map) {
                item = this._fileMD5Map[keyPath];
                extName = item.ext;
                fileName = this.getFullName(keyPath);
                // 获取得到相对路径：/resource/bigBattle/atlas
                fileRelPath = this.getRelativePath(keyPath);
                // 根据MD5码生成的文件名：game_new.5949b207.json
                fileMD5Name = this.getFileNameWithItem(keyPath, item);
                // xxx/resource/bigBattle/atlas/game_new.json
                // 等同于：src = path.join(env.PROJECT_PATH, fileRelPath, fileName);
                src = path.join(env.PROJECT_PATH, keyPath);
                // xxx/resource/bigBattle/atlas/game_new.5949b207.json
                dist = path.join(env.PROJECT_PATH, fileRelPath, fileMD5Name);

                // 单独处理default.xxx.res.json
                if (fileName == env.RES_JSON) {
                    let resJsonContent = fs.readFileSync(src, 'utf-8');
                    let resJsonObj = JSON.parse(resJsonContent);
                    if (resJsonObj && resJsonObj.hasOwnProperty('resources')) {
                        resJsonObj.resources.map((resItem) => {
                            let urlKeyPath = path.join('/', 'resource', resItem.url);
                            let urlKeyItem = this._fileMD5Map[urlKeyPath];
                            if (urlKeyItem) {
                                let urlKeyNewPath = this.getFileNameWithItem(urlKeyPath, urlKeyItem);
                                // resItem.url = path.join(this.getRelativePath(urlKeyPath), urlKeyNewPath).replace(new RegExp('^/resource/'), '');
                                resItem.url = `${env.ALIYUN.PATH_CDN}/${this.getFileNameWithItem(urlKeyPath, urlKeyItem)}`
                            }
                            // this.printColor(`【8、修改后为：${JSON.stringify(resItem)} 】`);
                        });
                        let newResContent = JSON.stringify(resJsonObj);
                        fsExtra.outputFileSync(src, JSON.stringify(resJsonObj));
                        // 修改了res文件，要重新生成md5，并且要上传
                        let oldMD5 = this._fileMD5Map[keyPath].md5;
                        let newMD5 = this.getMD5(newResContent);
                        this._fileMD5Map[keyPath].md5 = this._fileMD5Map[keyPath].crc = newMD5;
                        item = this._fileMD5Map[keyPath];
                        item.oldMD5 = oldMD5;
                        item.newMD5 = newMD5;
                        fileMD5Name = this.getFileNameWithItem(keyPath, item);
                        dist = path.join(env.PROJECT_PATH, fileRelPath, fileMD5Name);
                        if (newMD5 != oldMD5) {
                            this._uploadMap[keyPath] = item;
                        }
                    }
                } else if (fileName != env.THM_JSON && (extName === '.json' || extName === '.fnt' )) {
                    // 判断是否为json/fnt，过滤掉thm.json，且json/fnt名对应的png是否存在，如果存在表示的是图片集
                    let pngName = fileName.replace(new RegExp('.json|.fnt$'), '.png')
                        , pngKeyPath = path.join(fileRelPath, pngName)
                        , pngSrc = src.replace(new RegExp('.json|.fnt$'), '.png')
                        , pngItem
                        , pngMD5Name;
                    pngItem = this._fileMD5Map[pngKeyPath];
                    if (pngItem && fs.existsSync(pngSrc)) {
                        let jsonContent = fs.readFileSync(src, 'utf-8');
                        let jsonObj = JSON.parse(jsonContent);
                        if (jsonObj && jsonObj.hasOwnProperty('file')) {
                            pngMD5Name = this.getFileNameWithItem(pngKeyPath, pngItem);
                            jsonObj.file = pngMD5Name;
                            fsExtra.outputFileSync(src, JSON.stringify(jsonObj));
                            this.printColor(`【8、名为${fileName} 的json文件存在图片集：${pngKeyPath}, png的MD5为：${pngMD5Name}】`);
                        }
                    }
                }
                // 开始移动文件
                fsExtra.moveSync(src, dist);
                // 复制一份到all文件夹里面
                dist_all = path.join(env.UPLOAD_ALL_PATH, fileMD5Name);
                fsExtra.copySync(dist, dist_all);
                // 复制一份如果需要更新的文件到diff文件夹里面
                if (this._uploadMap[keyPath]) {
                    dist_diff = path.join(env.UPLOAD_DIFF_PATH, fileMD5Name);
                    fsExtra.copySync(dist, dist_diff);
                }

                let colorFunc;
                if (this._number % 2) {
                    colorFunc = gutil.colors.white;
                } else {
                    colorFunc = gutil.colors.red;
                }
                this.printColor(`【8、src      ：${src}`, colorFunc);
                this.printColor(`【8、dist     ：${dist}`, colorFunc);
                this.printColor(`【8、dist_all ：${dist_all}`, colorFunc);
                this.printColor(`【8、dist_diff：${dist_diff}`, colorFunc);

                this._number++;
            }

            // 单独处理resJsonItem


            resolve();
        });
    },

    combineCdnMD5Url: function () {
        return new Promise((resolve, reject) => {
            if (this._fileMD5Map == null)
                reject();
            else {
                let newFileMD5Map = {}
                    , item
                    , keyPath;
                for (keyPath in this._fileMD5Map) {
                    if (this._fileMD5Map.hasOwnProperty(keyPath)) {
                        item = this._fileMD5Map[keyPath];
                        newFileMD5Map[keyPath] = {
                            md5: item.md5,
                            ext: item.ext,
                            type: item.type || 1,
                            filename : this.getFullName(keyPath),
                            md5Url: `${env.ALIYUN.PATH_CDN}/${this.getFileNameWithItem(keyPath, item)}`
                        };

                    }
                }
                this.printColor(`【 9、处理完毕，resolve传递MD5集 】`, gutil.colors.red);
                this.printObj(newFileMD5Map);

                resolve(newFileMD5Map);
            }
        });
    },

    run: function (callback) {
        // Promise.all([
        //     this.getCDNVersion.call(this),
        //     this.getRulesFilesMD5.call(this),
        //     this.cacheVersion.call(this),
        //     this.printRet.call(this)
        // ]).catch((error) => {
        //     console.log("异常：" + error);
        // });
        this.getCDNVersion()
            .then(this.getRulesFilesMD5.bind(this))
            .then(this.cacheVersion.bind(this))
            .then(this.copyAndRenameFiles.bind(this))
            .then(this.modifyResourceFiles.bind(this))
            .then(this.combineCdnMD5Url.bind(this))
            .then((data, content) => {
                if (typeof callback == 'function') {
                    this.printColor(`【 10、传递MD5集给回调函数 】`, gutil.colors.red);
                    this.printColor(`【 11、上传CDN的结合 】`, gutil.colors.green);
                    this.printObj(this._uploadMap);
                    callback(data);
                }
            })
            .catch((error) => {
                this.printColor("异常：" + error, gutil.colors.red);
            });
    }
};
module.exports = checkFiles;
