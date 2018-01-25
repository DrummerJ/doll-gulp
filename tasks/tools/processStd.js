let colors = require('colors')
    , co = require('co')
    , positiveCodeArr = ['y', '1', 'yes', '是']
    , negativeCodeArr = ['n', '0', 'no', '否'];

// 命令行确认操作
module.exports = function (steps, endCallback, context) {
    steps = steps || [];
    endCallback = endCallback || function () {
    };

    let that = this;
    that._fousIndex = 0;
    that.init = function () {
        that.stdin = process.stdin;
        that.stdout = process.stdout;
        that.stdin.resume();
        that.stdin.setEncoding('utf8');

        that._bindDataEvent();
        that._bindEndEvent();
        that._printMessage();
    };

    that._bindDataEvent = function () {
        that.stdin.on('data', function (chunk) {
            that._triggerEvent(chunk);
        });
    };

    that._bindEndEvent = function () {
        that.stdin.on('end', function () {
            // console.log('触发结束事件!!');
            typeof endCallback === 'function' && endCallback.call(context || null);
        });
    };

    that._printMessage = function () {
        if (!steps[that._fousIndex]) {
            that.stdin.emit('end');
            return;
        }

        // console.log('触发事件索引：' + that._fousIndex);
        let step = steps[that._fousIndex];
        stdout.write(step.message.green);
    };

    that._triggerEvent = function (chunk) {
        let step = steps[that._fousIndex];
        if (!step)
            return;

        let message = chunk.trim().toLocaleLowerCase();
        if (positiveCodeArr.indexOf(message) >= 0 && typeof step.positive === 'function') {
            // step.positive.call(step.context || null);
            co(step.positive).then(() => {
                that._fousIndex++;
                that._printMessage();
            });

        } else if (negativeCodeArr.indexOf(message) >= 0) {
            typeof step.negative === 'function' && step.negative.call(step.context || null);
            that._fousIndex++;
            that._printMessage();
        }
    };

    return {
        init: that.init
    }
};