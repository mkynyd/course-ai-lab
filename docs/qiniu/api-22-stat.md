---
title: 资源元信息查询
source: https://developer.qiniu.com/kodo/api/1308/stat
updated: 2026-01-05 14:22:59 +0800
fetched: 2026-06-18T15:34:11+00:00
category: api
---

# 资源元信息查询

> 来源：[https://developer.qiniu.com/kodo/api/1308/stat](https://developer.qiniu.com/kodo/api/1308/stat)
> 原文更新时间：2026-01-05 14:22:59 +0800

> 资源元信息查询

# **描述**

本接口仅用于获取资源的 `Metadata` 信息，不返回资源内容。\

# **请求**

### **请求语法**

``` v-md-prism-
GET /stat/<EncodedEntryURI> HTTP/1.1
Host:          rs.qiniuapi.com
Content-Type:  application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu <AccessToken>
```


### **请求参数**

| 参数名称 | 必填 | 说明 |
|----|----|----|
| EncodedEntryURI | 是 | 具体请参考[EncodedEntryURI](https://developer.qiniu.com/kodo/api/1276/data-format) |


### **请求头**

[TABLE]


### **请求内容**

该请求操作的请求体为空。


# **响应**

### **响应头**

| 头部名称 | 必填 | 说明 |
|:---|:---|:---|
| Content-Type | 是 | 正常情况下该值将被设为 `application/json`，表示返回 JSON 格式的文本信息。 |
| 其他 |  | 该请求操作的实现使用了所有操作的公共响应头。详情请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。 |


### **响应内容**

[TABLE]


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。\

# **示例**

### **请求示例**

``` v-md-prism-
GET /stat/ZGVtbzoyMDEzLTAyLTA5LTA3LTM5LTIwLmpwZw== HTTP/1.1
User-Agent: curl/7.30.0
Host: rs.qiniuapi.com
Accept: */*
Content-Type: application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu QNJi_bYJlmO5LeY08FfoNj9w_r72Vsn...(过长已省略)
```

*注：要在`Authorization`头部的`<AccessToken>`前添加`Qiniu`和半角空格。*


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Server: nginx/1.0.8
Date: Mon, 02 Jan 2006 15:04:05 GMT
Content-Type: application/json
Connection: keep-alive
Cache-Control: no-store
Content-Length: 121
X-Log: qtbl.get;RS
X-Reqid: swEAAMipp-5bIjMT

{
    "fsize":        5122935,
    "hash":         "ljfockr0lOil_bZfyaI2ZY78HWoH",
    "mimeType":     "application/octet-stream",
    "putTime":      13603956734587420,
    "md5":          "e41714a18899cf59c200a9bddfa78b95"
}
```
