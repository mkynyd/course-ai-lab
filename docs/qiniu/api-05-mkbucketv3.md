---
title: 创建 Bucket
source: https://developer.qiniu.com/kodo/api/1382/mkbucketv3
updated: 2025-11-05 10:54:35 +0800
fetched: 2026-06-18T15:34:05+00:00
category: api
---

# 创建 Bucket

> 来源：[https://developer.qiniu.com/kodo/api/1382/mkbucketv3](https://developer.qiniu.com/kodo/api/1382/mkbucketv3)
> 原文更新时间：2025-11-05 10:54:35 +0800

> 创建空间API

# **描述**

本接口用于创建一个新的 Bucket。此接口不支持匿名请求。您可以在请求参数中指定存储区域，例如，您在华东，选择华东存储区域可以减少延迟、降低成本。


# **请求**

### **请求语法**

``` v-md-prism-
POST /mkbucketv3/<BucketName>/region/<Region> HTTP/1.1
Host: uc.qiniuapi.com
Content-Type: application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu <AccessToken>
```

使用说明：

- 如果请求的 Bucket 已经存在/重名，返回错误码 614，错误信息：目标资源已存在。

- 如果创建的 Bucket 不符合命名规范，返回错误码 400，错误信息：invalid arguments。

- 如果发起创建 Bucket 请求的时候，没有传入认证信息，返回错误码 401，错误信息：bad token。

- 如果创建 Bucket 的时候超过最大创建数（默认 20 个），返回错误码 630，错误信息：too many buckets。

- 目前 Bucket 有两种访问权限：公开和私有。创建的 Bucket，默认为公开权限。

- Bucket 名称和其存储所在区域在创建后无法修改。


### **请求参数**

| 参数名称 | 必填 | 说明 |
|----|----|----|
| BucketName | 是 | 空间名称，要求**在对象存储系统范围内唯一**，由3～63个字符组成，支持小写字母、短划线`-`和数字，且必须以小写字母或数字开头和结尾。 |
| Region | 否 | 存储区域 ID，默认 z0。 存储区域 ID 列表见 [存储区域列表](https://developer.qiniu.com/kodo/1671/region-endpoint-fq) |


### **请求头**

该请求操作的实现使用了所有操作的公共请求头。有关详细信息，请查阅[公共请求头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **请求内容**

该请求操作的请求体为空。


# **响应**

### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-response-headers)。


### **响应内容**

该请求操作的响应体为空。


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **示例**

### **请求示例**

``` v-md-prism-
POST /mkbucketv3/mybucketforvideo HTTP/1.1
Host: uc.qiniuapi.com
User-Agent: Go-http-client/1.1
Content-Length: 0
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu j853F3bLkWl59I5BOkWm6q1Z1mZClpr9Z9CLfDE0:nP7NSSyGo4x3W_nJ8T9X1gJrgpk=
```

*注：要在 `Authorization` 头部的 `<AccessToken>` 前添加 `Qiniu` 和半角空格。*


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Length: 2
Connection: keep-alive
Content-Type: application/json
Date: Mon, 02 Jan 2006 15:04:05 GMT
Server: nginx
X-Reqid: SFkAAAC8BDebTtsU

{}
```
