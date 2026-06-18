---
title: 删除空间标签
source: https://developer.qiniu.com/kodo/api/6316/delete-bucket-tagging
updated: 2025-11-05 10:54:35 +0800
fetched: 2026-06-18T15:34:07+00:00
category: api
---

# 删除空间标签

> 来源：[https://developer.qiniu.com/kodo/api/6316/delete-bucket-tagging](https://developer.qiniu.com/kodo/api/6316/delete-bucket-tagging)
> 原文更新时间：2025-11-05 10:54:35 +0800

> 删除空间标签API

# **描述**

本接口用于一键删除指定空间的所有标签。


# **请求**

### **请求语法**

``` v-md-prism-
DELETE /bucketTagging?bucket=<BucketName> HTTP/1.1
Host: uc.qiniuapi.com
Content-Type: application/json
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu <AccessToken>
```


### **请求参数**

| 参数名称   | 必填 | 说明     |
|------------|------|----------|
| BucketName | 是   | 空间名称 |


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
DELETE /bucketTagging?bucket=temp-bucket-wdszkatkt3hdk3cid9dnz0 HTTP/1.1
Host: uc.qiniuapi.com
User-Agent: Go-http-client/1.1
Content-Length: 0
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu HwFOxpYCQU6oXoZXFOTh1mq5ZZig6Yyocgk3BTZZ:kHhCAVNFp4hti6x7YMMi1_9Fs7k=
Content-Type: application/json 
```


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Length: 2
Connection: keep-alive
Content-Type: application/json
Date: Mon, 02 Jan 2006 15:04:05 GMT
X-Reqid: rWkAAJJlhDXGrdYV

{}
```
