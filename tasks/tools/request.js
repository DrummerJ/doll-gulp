var http = require('http');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

module.exports = {
    requestFileUrl: function (url, callback) {
        http.get(url, function (res) {
            var size = 0;
            var chunks = [];
            var bufferHelper = new BufferHelper();

            res.on('data', function (chunk) {
                bufferHelper.concat(chunk);
            });

            // 数据获取完毕事件。
            res.on('end', function () {
                // 成功处理回调
                var buffer = bufferHelper.toBuffer();
                var content = iconv.decode(buffer, 'utf-8');
                if (typeof callback == "function") {
                    callback(1, content);
                }
            });

        }).on('error', function (e) {
            // 失败回调
            if (typeof callback == "function") {
                callback(0, e);
            }
        });
    }
};