# 基于PaddleRS的遥感智能解译平台

## 1 项目说明

本项目为第十一届 “中国软件杯”大学生软件设计大赛遥感解译赛道中web系统前端项目。

## 2 团队成员

- 续兴
- 冯湛芸
- 何宇嘉
- 陈佳乐

## 3 环境要求

需要安装[Node.js](https://nodejs.org/en/download/)。

## 4 项目安装

执行如下命令，安装相关组件及依赖

```sh
# 到文件夹目录下
cd rs-interpret-vue
npm install
```

## 5 开发环境配置

### 5.1 相关配置

修改vite.config.js文件中的server，其中host为监听ip，port为监听端口。

修改src/App.vue中的baseUrl，将其地址改为相应的后端地址。

### 5.2 开发版启动

执行一下命令，启动开发项目，本地浏览器访问http://http://localhost:port

```sh
# 到文件夹目录下
cd rs-interpret-vue
npm run dev
```

## 6 生产环境打包

执行以下命令，打包后生成dist文件，即为部署文件。

```sh
# 到文件夹目录下
cd rs-interpret-vue
npm run build
```

## 7 项目部署

### 7.1 Nginx安装及配置

下载[Nginx](https://nginx.org/en/download.html)，针对系统选择相应版本安装并配置。下面以Windows环境为例，修改nginx文件夹下conf文件夹中的nginx.conf文件，

```sh
server {
    # 监听端口
    listen       8889;
    # 服务器公网ip
    server_name  124.223.198.115;

    #charset koi8-r;

    #access_log  logs/host.access.log  main;
    # 根目录，前端文件放置文件夹
    root    html;

    location  / {
        # root   html;
        try_files $uri $uri/ /index.html;
        index  index.html index.htm;
    }
    # 前端访问地址，ip:port/rs-interpret-vue即可访问
    location ^~ /rs-interpret-vue {
        try_files $uri $uri/ /rs-interpret/index.html;
        index  index.html index.htm;
    }
}
```

### 7.2 前端项目部署

修改打包后的dist文件名，将其改为rs-interpret-vue（或其他，需对应7.1中nginx配置的地址名）。将文件夹放置于nginx文件中的html文件夹中（及7.1中nginx配置的根目录，可修改为其他）。

### 7.3 项目启动

在nginx文件夹下打开控制台，执行以下命令。启动后，浏览器访问ip:port/rs-interpret-vue即可。

```sh
nginx
```
