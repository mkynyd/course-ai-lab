---
title: 删除 Bucket
source: https://developer.qiniu.com/kodo/api/1601/drop-bucket
updated: 2025-11-05 10:54:35 +0800
fetched: 2026-06-18T15:34:06+00:00
category: api
---

# 删除 Bucket

> 来源：[https://developer.qiniu.com/kodo/api/1601/drop-bucket](https://developer.qiniu.com/kodo/api/1601/drop-bucket)
> 原文更新时间：2025-11-05 10:54:35 +0800

> 删除存储空间

# **描述**

本接口用于删除指定的 Bucket。


# **请求**

### **请求语法**

``` v-md-prism-
POST /drop/<BucketName> HTTP/1.1
Host: uc.qiniuapi.com
Content-Type: application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu <AccessToken>
```

使用说明：

- 删除存储空间后，其中保存的文件也会被删除，无法恢复。

- 删除存储空间后，空间名称可以被重新使用。


### **请求参数**

| 参数名称   | 必填 | 说明                 |
|------------|------|----------------------|
| BucketName | 是   | 需要删除的目标空间名 |


### **请求头**

该请求操作的实现使用了所有操作的公共请求头。有关详细信息，请查阅[公共请求头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **请求内容**

该请求操作的请求体为空。


# **响应**

### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-header)。


### **响应内容**

该请求操作的响应体为空。


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **示例**

### **请求示例**

``` v-md-prism-
POST /drop/test05 HTTP/1.1
Host: uc.qiniuapi.com
User-Agent: Go-http-client/1.1
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu j853F3bLkWl59I5BOkWm6q1Z1mZClpr9Z9CLfDE0:nj2E4apIRDq67g_PMJ932w_2qiA=
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
X-Reqid: r3oAAD-vqeUyT9sU

{}
```
