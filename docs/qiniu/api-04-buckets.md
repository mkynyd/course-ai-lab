---
title: 获取 Bucket 列表
source: https://developer.qiniu.com/kodo/api/3926/get-service
updated: 2024-05-21 14:10:26 +0800
fetched: 2026-06-18T15:34:05+00:00
category: api
---

# 获取 Bucket 列表

> 来源：[https://developer.qiniu.com/kodo/api/3926/get-service](https://developer.qiniu.com/kodo/api/3926/get-service)
> 原文更新时间：2024-05-21 14:10:26 +0800

> 获取请求用户下的所有存储空间

# **描述**

本接口作 GET 请求用来获取请求者拥有的所有存储空间列表。该接口需要您使用带 Authorization 签名认证的请求，如果使用匿名请求无法获取存储空间列表，且只能获取签名中 AccessKey 所属账户的存储空间列表。


# **请求**

### **请求语法**

``` v-md-prism-
GET /buckets?tagCondition=<Encodedtags> HTTP/1.1
Host: uc.qiniuapi.com
Content-Type: application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu <AccessToken>
```


### **请求参数**

[TABLE]


### **请求头**

该请求操作的实现使用了所有操作的公共请求头。有关详细信息，请查阅[公共请求头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **请求内容**

该请求操作的请求体为空。


# **响应**

### **响应语法**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Type: application/json
[
BucketName
]
```


### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **响应内容**

[TABLE]


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **示例**

### **请求示例**

``` v-md-prism-
GET /buckets?tagCondition=S09ETy1CVUtDRVQtVEFHUy1rZXktWDdPNjZiNkxLdz1LT0RPLUJVS0NFVC1UQUdTLXZhbHVlLWdFOGhIV2VXUGo= HTTP/1.1
Host: uc.qiniuapi.com
User-Agent: Go-http-client/1.1
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu HwFOxpYCQU6oXoZXFOTh1mq5ZZig6Yyocgk3BTZZ:8tgafMszuwgd99Ix4eQ2HeVT9B0=
```

*注：要在 `Authorization` 头部的 `<AccessToken>` 前添加 `Qiniu` 和半角空格。*


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Length: 75
Connection: keep-alive
Content-Type: application/json
Date: Mon, 02 Jan 2006 15:04:05 GMT
X-Reqid: rWkAACgHbskB5dYV

[
  "temp-bucket-xufk1x3r1wa9ayoy7knuz0", 
  "temp-bucket-pighpwdt7lu88ljltffmz0"
]
```
