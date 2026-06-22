---
title: 资源删除
source: https://developer.qiniu.com/kodo/api/1257/delete
updated: 2023-03-02 18:58:19 +0800
fetched: 2026-06-18T15:34:12+00:00
category: api
---

# 资源删除

> 来源：[https://developer.qiniu.com/kodo/api/1257/delete](https://developer.qiniu.com/kodo/api/1257/delete)
> 原文更新时间：2023-03-02 18:58:19 +0800

> 资源删除 (delete) 接口文档

# **描述**

本接口用于删除指定文件。\

# **请求**

### **请求语法**

``` v-md-prism-
POST /delete/<EncodedEntryURI> HTTP/1.1
Host:           rs.qiniuapi.com
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


# 响应

## 响应语法

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
| 200 | 删除成功 |
| 400 | 请求报文格式错误 |
| 401 | 管理凭证无效 |
| 599 | 服务端操作失败 |
| 612 | 待删除文件不存在 |
| 其他错误码 | 请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses) |

如遇599错误，请将完整错误信息（包括所有HTTP响应头部）[提交工单](https://support.qiniu.com/tickets/category) 给我们。\

# **示例**

## 请求示例

``` v-md-prism-
POST /delete/bmV3ZG9jczpmaW5kX21hbi50eHQ= HTTP/1.1
User-Agent: curl/7.30.0
Host: rs.qiniuapi.com
Accept: */*
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu u8WqmQu1jH21kxpIQmo2LqntzugM1VoHE9_pozCU:2LJIG...(过长已省略)
```

*注：要在`Authorization`头部的`<AccessToken>`前添加`Qiniu`和半角空格。*\

### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Server: nginx/1.0.8
Date: Mon, 02 Jan 2006 15:04:05 GMT
Content-Type: application/json
Connection: keep-alive
Content-Length: 0
X-Reqid: wxIAAD3btw-v3TwT
```
