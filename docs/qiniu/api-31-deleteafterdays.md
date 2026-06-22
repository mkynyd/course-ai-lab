---
title: 修改文件过期删除时间
source: https://developer.qiniu.com/kodo/api/1732/update-file-lifecycle
updated: 2023-03-02 18:59:52 +0800
fetched: 2026-06-18T15:34:14+00:00
category: api
---

# 修改文件过期删除时间

> 来源：[https://developer.qiniu.com/kodo/api/1732/update-file-lifecycle](https://developer.qiniu.com/kodo/api/1732/update-file-lifecycle)
> 原文更新时间：2023-03-02 18:59:52 +0800

> 修改文件过期删除时间文档

# **描述**

本接口用于修改指定资源的过期删除时间。\
修改指定资源生命周期其他时间，比如转低频存储时间和转归档存储时间，请参考 [修改文件生命周期](https://developer.qiniu.com/kodo/api/8062/modify-object-life-cycle)。后续可以通过 [资源元信息查询](https://developer.qiniu.com/kodo/1308/stat) 查看修改生命周期相关时间。\

# **请求**

### **请求语法**

``` v-md-prism-
POST /deleteAfterDays/<EncodedEntryURI>/<deleteAfterDays> HTTP/1.1
Host:           rs.qiniuapi.com
Content-Type:   application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization:  Qiniu <AccessToken>
```

使用说明：

- 文件在设置的 `<deleteAfterDays>` 天之后被删除， **删除后不可恢复**


### **请求参数**

| 参数名称 | 必填 | 说明 |
|----|----|----|
| EncodedEntryURI | 是 | 指定文件信息，详情请参考[EncodedEntryURI](https://developer.qiniu.com/kodo/api/1276/data-format) |
| deleteAfterDays | 是 | 值为数字，设置为 0 表示取消过期删除设置 |


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
| 200 | 更新成功 |
| 400 | 请求报文格式错误 |
| 401 | 管理凭证无效 |
| 599 | 服务端操作失败 |
| 612 | 待设置生命周期的资源不存在 |
| 其他错误码 | 请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses) |

如遇 599 错误，请将完整错误信息（包括所有 HTTP 响应头部）[提交工单](https://support.qiniu.com/tickets/category) 给我们。


# **示例**

### **请求示例**

``` v-md-prism-
POST /deleteAfterDays/bmV3ZG9jczpmaW5kX21hbi50eHQ=/1 HTTP/1.1
User-Agent: curl/7.30.0
Host: rs.qiniuapi.com
X-Qiniu-Date: 20060102T150405Z
Accept: */*
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
X-Reqid: wxIAAD3btw-v3TwT
```
