---
title: 资源复制
source: https://developer.qiniu.com/kodo/api/1254/copy
updated: 2023-03-02 18:58:09 +0800
fetched: 2026-06-18T15:34:12+00:00
category: api
---

# 资源复制

> 来源：[https://developer.qiniu.com/kodo/api/1254/copy](https://developer.qiniu.com/kodo/api/1254/copy)
> 原文更新时间：2023-03-02 18:58:09 +0800

> 资源复制 (copy) 接口文档

# **描述**

本接口用于将指定文件复制为新命名文件。\

# **请求**

### **请求语法**

``` v-md-prism-
POST /copy/<EncodedEntryURISrc>/<EncodedEntryURIDest>/force/<true|false> 
HTTP/1.1
Host:           rs.qiniuapi.com
Content-Type:   application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization:  Qiniu <AccessToken>
```

使用说明：

- 源空间和目标空间必须属于相同账号，跨账号复制文件不支持。
- 文件不支持跨存储区域复制。
- 归档/深度归档存储文件，只有解冻状态时可以复制。copy 获得的目标文件为冻结状态。\

### **请求参数**

| 参数名称 | 必填 | 说明 |
|----|----|----|
| EncodedEntryURISrc | 是 | 源文件，需要经过 Base64 编码，具体请参考[EncodedEntryURI](https://developer.qiniu.com/kodo/api/1276/data-format) |
| EncodedEntryURIDest | 是 | 目标文件，需要经过 Base64 编码，具体请参考[EncodedEntryURI](https://developer.qiniu.com/kodo/api/1276/data-format) |
| force | 否 | bool 类型，默认 false。如果目标文件名已被占用，则返回错误码 614，且不做任何覆盖操作；如果指定为 true，会强制覆盖目标文件 |


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
| 其他 |  | 该请求操作的实现使用了所有操作的公共响应头。详情请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。 |


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

如遇599错误，请将完整错误信息（包括所有HTTP响应头部）[提交工单](https://support.qiniu.com/tickets/category) 给我们。


# **示例**

### **请求示例**

``` v-md-prism-
POST /copy/bmV3ZG9jczpmaW5kX21hbi50eHQ=/bmV3ZG9jczpmaW5kLm1hbi50eHQ= HTTP/1.1
User-Agent: curl/7.30.0
Host: rs.qinuapi.com
Accept: */*
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu u8WqmQu1jH21kxpIQmo2LqntzugM1VoHE9_pozCU:2LJIG...(过长已省略)
```

*注: 要在`Authorization`头部的`<AccessToken>`前添加`Qiniu`和半角空格。*\

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
