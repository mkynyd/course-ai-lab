---
title: 镜像资源更新
source: https://developer.qiniu.com/kodo/api/1293/prefetch
updated: 2023-03-02 19:00:13 +0800
fetched: 2026-06-18T15:34:15+00:00
category: api
---

# 镜像资源更新

> 来源：[https://developer.qiniu.com/kodo/api/1293/prefetch](https://developer.qiniu.com/kodo/api/1293/prefetch)
> 原文更新时间：2023-03-02 19:00:13 +0800

> 镜像资源更新(prefetch)接口文档

# **描述**

对设置了镜像存储的空间，使用本接口将镜像源站抓取指定名称的文件并存储到该空间中。\
如果该空间中已存在该名称的文件，则会将镜像源站的文件覆盖空间中相同名称的文件。\

# **请求**

### **请求语法**

``` v-md-prism-
POST /prefetch/<EncodedEntryURI>
Host:           iovip-<Region>.qiniuio.com
Content-Type:   application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization:  Qiniu <AccessToken>
```


### **请求参数**

| 参数名称 | 必填 | 说明 |
|----|----|----|
| EncodedEntryURI | 是 | 指定文件信息，详情请参考[EncodedEntryURI](https://developer.qiniu.com/kodo/api/1276/data-format) |


### **请求头**

[TABLE]


### **请求内容**

该请求操作的请求体为空。\

# **响应**

### **响应语法**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
```


### **响应头**

| 头部名称 | 必填 | 说明 |
|:---|:---|:---|
| Content-Type | 是 | 正常情况下该值将被设为 `application/json`，表示返回 JSON 格式的文本信息。 |
| 其他 |  | 其它可能返回的头部信息，请参考[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。 |


### **响应内容**

如果请求成功，不返回任何内容。\
如果请求失败，返回包含如下内容的 JSON 字符串（已格式化，便于阅读）：

``` v-md-prism-
{
    "error":   "<errMsg    string>",
}
```

| 字段名称 | 必填 | 说明                         |
|:---------|:-----|:-----------------------------|
| error    | 是   | 与 HTTP 状态码对应的消息文本 |


### **响应状态码**

| HTTP状态码 | 含义 |
|:---|:---|
| 200 | 抓取成功 |
| 400 | 请求报文格式错误 |
| 401 | 管理凭证无效 |
| 404 | 抓取资源不存在 |
| 478 | 源站返回404外，所有非200的response都返回478。 |
| 599 | 服务端操作失败 |
| 其他错误码 | 请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses) |

如遇 599 错误，请将完整错误信息（包括所有 HTTP 响应头部）[提交工单](https://support.qiniu.com/tickets/category) 给我们。


# **示例**

### **请求示例**

``` v-md-prism-
POST /prefetch/bmV3ZG9jczpmaW5kLm1hbi50eHQ= HTTP/1.1
User-Agent: curl/7.30.0
Host: iovip.qiniuio.com
Accept: */*
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu u8WqmQu1jH21kxpIQmo2LqntzugM1VoHE9_pozCU:2LJIG...(过长已省略)
```

*注：要在 `Authorization` 头部的 `<AccessToken>` 前添加 `Qiniu` 和半角空格。*\

### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Server: nginx/1.0.8
Date: Mon, 02 Jan 2006 15:04:05 GMT
Content-Type: application/json
Connection: keep-alive
Content-Length: 0
X-Log: RS.in;RS.mo;qtbl.mv:3;MQ;MC/404;RS.mcd:1;RS:5
X-Reqid: wxIAAD3btw-v3TwT
```

*注：本接口在执行同步操作时，如果抓取的资源过大或者源站响应过慢，可能会导致超时。*
