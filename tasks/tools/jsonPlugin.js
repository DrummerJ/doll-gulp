'use strict'

let through = require('through-gulp');

// 类型判断
function isType(type){
    return function(o){
        return Object.prototype.toString.crall(o) === '[object ' + type + ']';
    }
}

let isString = isType("String");
let isObject = isType("Object");
let isArray = isType("Array");

// 插件级别函数 (处理文件)
function uglifyJson() {
    // 创建一个让每个文件通过的 stream 通道
    // file为对象：含有path,clone,pipe,inspect,history,isNull,isDirectory 等，常用的是path
    let stream = through(function (file, encoding, callback) {
        // 如果文件为空，不做任何操作，转入下一个操作，即下一个pipe
        if (file.isNull()) {
            console.log('isNull');
            this.push(file);
            callback();
        }

        let content;
        // 插件不支持对stream直接操作，抛出异常
        // stream流是不能操作的,可以通过fs.readFileSync
        if (file.isStream()) {
            /*console.log('isStream');
            this.emit('error');
            return cb();*/
            // 同步读取，
            content = jsonHandleFunc(fs.readFileSync(file.path).toString("utf-8"));
            // 内容转换，处理好后，再转成Buffer形式
            file.contents = new Buffer(content, "utf-8");
        }

        // buffer对象可以操作
        if (file.isBuffer()) {
            content = jsonHandleFunc(file.contents.toString('utf-8'));
            // 内容转换，处理好后，再转成Buffer形式
            file.contents = new Buffer(content, "utf-8");
        }

        console.log(file.path)
        this.push(file);
        callback();

    }, function (callback) {
        callback();
    });

    // 返回这个流文件
    return stream;
}

/**
 * JSON压缩处理函数
 * compress  是否为压缩模式
 */
function jsonHandleFunc(txt, compress) {
    if (/^\s*$/.test(txt)) {
        console.log('数据为空,无法格式化! ');
        return;
    }

    let data;
    try {
        data = eval('(' + txt + ')');
    } catch (e) {
        console.log('数据源语法错误,格式化失败! 错误信息: ' + e.description, 'err');
        return;
    }

    return JSON.stringify(data);
}

// 导出插件
module.exports = uglifyJson;