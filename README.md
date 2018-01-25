# 目录说明：
######dist 
表示打包文件命令时自动生成的目录，来自于path.js下面配置DIR_BUILD接口
######env 
没有使用到，可删除

######tasks/tools
* 1、执行cdn文件与本地md5Rules规则的文件比较
* 2、请求api
* 3、json压缩工具
    
######tasks/tools/md5Rules.js
匹配规则出来的文件打码后，用于gulp通过path.js里面的配置进行合并后，inject进入html中

######upload/all  
表示根据md5Rules规则生成的所有文件，只是为了查看，没有用

######upload/diff 
表示打包后上传文件，上传到cdn（重要）

######versionCfg.json 
打包cdn比较缓存md5，用于下一次打包比较所用

#命令使用：
######打包dev环境包：（package.json的scripts配置）
node run dev

dev 打包完成后，直接开启浏览器就可以运行:localhost:8181
进入游戏需要token，客户端测试使用：
localhost:8181?token=....

######打包生产环境包：（package.json的scripts配置）
node run prod或者build 

######prod/build 打包完成后
第一步，上传upload/diff下面的所有文件到cdn服务器下面
第二步，删除dist/libs目录（prod/build）后这里面的文件不需要了（可以在gulp_prod最后再加一个删除这个目录的任务）
第三步，copy dist目录到web服务器环境下就即可在浏览器中访问，例如
127.0.0.1
进入游戏需要token，客户端测试使用：
127.0.0.1/index.html?token=....


######package.json

v1.0.1
    表示的是：/Users/xxx/Doll/bin-release/web/v1.0.1

npm run dev    
dev : gulp --gulpfile ./gulp_dev.js --env v1.0.4
打包项目目录：/Users/xxx/Doll/bin-release/web/v1.0.4

npm run prod
gulp --gulpfile ./gulp_prod.js --env
      默认为v1.0.1
打包项目目录：/Users/xxx/Doll/bin-release/web/v1.0.1
      
      
      
# 提示1
prod打包下会开启压缩图片任务，build的时候会花费时间.
* 如果长时间卡主不动，建议重新执行打包命令npm run prod，
* 如果resource资源目录下面的图片已经是最优压缩图片，建议进入gulp_prod.js定位71行，打开注释掉的return taskjson，不执行下面的图片压缩

```
// release版本目录下压缩resource资源
gulp.task('mini:resource', ['copy:res:version:resource'], function ( callback ) {
    // 压缩json文件
    var taskJson = commonTask.minifyResourceJson('resource');
    // return taskJson;

    // 压缩png/jpg资源
    var taskImage = commonTask.minifyResourceImg('resource');
    return merge(taskJson, taskImage);
});      
```


# 提示2

      
           




