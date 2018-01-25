/**
 * 需要md5比较的文件
 * type：表示替换的规则（1:处理libs下面的js、css、json文件   2、表示处理resource下面的资源文件）
 */
var rules = [
    {
        // 'libs/*.{css,json,js}',
        // 'libs/**/*.{css,json,js}',
        // 'libs/**/*.*',
        src: 'libs/**/*',
        type: 1
    },
    {
        src: 'resource/**/*',
        type: 2
    }
];


module.exports = {
    rules: rules
};