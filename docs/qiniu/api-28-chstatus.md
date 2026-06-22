---
title: 修改文件状态
source: https://developer.qiniu.com/kodo/api/4173/modify-the-file-status
updated: 2023-03-02 18:59:11 +0800
fetched: 2026-06-18T15:34:13+00:00
category: api
---

# 修改文件状态

> 来源：[https://developer.qiniu.com/kodo/api/4173/modify-the-file-status](https://developer.qiniu.com/kodo/api/4173/modify-the-file-status)
> 原文更新时间：2023-03-02 18:59:11 +0800

> 修改文件状态

# **描述**

本接口用于修改文件的存储状态，即禁用和启用状态间的的互相转换。\
处于禁用状态的文件将只能通过签发 Token 的方式访问 [下载凭证](https://developer.qiniu.com/kodo/manual/1202/download-token)。\

# **请求**

### **请求语法**

``` v-md-prism-
POST /chstatus/<EncodedEntryURI>/status/<status> HTTP/1.1
Host:           rs.qiniuapi.com
Content-Type:   application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization:  Qiniu <AccessToken>
```


### **请求参数**

| 参数名称 | 必填 | 说明 |
|----|----|----|
| EncodedEntryURI | 是 | 指定文件信息，详情请参考[EncodedEntryURI](https://developer.qiniu.com/kodo/api/1276/data-format) |
| status | 是 | 值为数字，0表示启用，1表示禁用 |


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

[TABLE]

如遇 599 错误，请将完整错误信息（包括所有 HTTP 响应头部）[提交工单](https://support.qiniu.com/tickets/category) 给我们。\

# **示例**

### **请求示例**

``` v-md-prism-
POST /chstatus/aXRpc2F0ZXN0OmdvZ29waGVyLmpwZw==/status/1 HTTP/1.1
User-Agent: curl/7.30.0
Host: rs.qiniuapi.com
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu bt500PzCG9tV0bccCOdnrmCHPXCPLieGSDEprB7M:4wG...(过长已省略)
```

*注：要在`Authorization`头部的`<AccessToken>`前添加`Qiniu`和半角空格。*\

### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Server: nginx/1.4.4
Date: Mon, 02 Jan 2006 15:04:05 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
X-Reqid: vDEAAG2lN7zSqpQT
```
