---
title: 资源元信息修改
source: https://developer.qiniu.com/kodo/api/1252/chgm
updated: 2025-12-16 16:02:14 +0800
fetched: 2026-06-18T15:34:11+00:00
category: api
---

# 资源元信息修改

> 来源：[https://developer.qiniu.com/kodo/api/1252/chgm](https://developer.qiniu.com/kodo/api/1252/chgm)
> 原文更新时间：2025-12-16 16:02:14 +0800

> 资源元信息修改

# **描述**

本接口用于修改文件的 MIME 类型信息。


# **请求**

### **请求语法**

``` v-md-prism-
POST /chgm/<EncodedEntryURI>/mime/<EncodedMimeType>/x-qn-meta-<meta_key>/<EncodedMetaValue>/cacheControl/<EncodedCacheControl>/contentDisposition/<EncodedContentDisposition>/contentLanguage/<EncodedContentLanguage>/contentEncoding/<EncodedContentEncoding>/expires/<EncodedExpires>/cond/<Encodedcond> HTTP/1.1
Host:           rs.qiniuapi.com
Content-Type:   application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization:  Qiniu <AccessToken>
```

使用说明：

- 归档/深度归档存储文件，只有解冻状态时可以修改 MIME 类型信息


### **请求参数**

[TABLE]


### **请求头**

[TABLE]


### **请求内容**

该请求操作的请求体为空。


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

如遇 599 错误，请将完整错误信息（包括所有 HTTP 响应头部）[提交工单](https://support.qiniu.com/tickets/category) 给我们。


# **示例**

### **请求示例**

``` v-md-prism-
POST /chgm/YnVja2V0OmtleQ==/x-qn-meta-meta_key/bWV0YV92YWx1ZQ==/cond/ZnNpemU9Ng==  HTTP/1.1
Host: rs.qiniuapi.com
User-Agent: Go-http-client/1.1
Content-Length: 0
Authorization: Qiniu EmEtww5prO5pe8ts_mG.......1tXlEQ9hoG4:LuGCwpfK-rM=
X-Qiniu-Date: 20060102T150405Z
Content-Type: application/x-www-form-urlencoded
Accept-Encoding: gzip
```

*注：要在 `Authorization` 头部的 `<AccessToken>` 前添加 `Qiniu` 和半角空格。*\

### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Server: nginx
Date: Mon, 02 Jan 2006 15:04:05 GMT
Content-Type: application/json
Content-Length: 0
Connection: keep-alive
X-Reqid: -nIAABnfaeIlucoU
```
