---
title: 设置 Bucket 访问权限
source: https://developer.qiniu.com/kodo/api/3946/set-bucket-private
updated: 2025-11-05 10:54:35 +0800
fetched: 2026-06-18T15:34:06+00:00
category: api
---

# 设置 Bucket 访问权限

> 来源：[https://developer.qiniu.com/kodo/api/3946/set-bucket-private](https://developer.qiniu.com/kodo/api/3946/set-bucket-private)
> 原文更新时间：2025-11-05 10:54:35 +0800

> 设置存储空间的访问权限接口

# **描述**

本接口用于设置 Bucket 访问权限。目前 Bucket 有两种访问权限：公开和私有。创建 Bucket 时默认为公开空间。


# **请求**

### **请求语法**

``` v-md-prism-
POST /private?bucket=<BucketName>&private=<Private> HTTP/1.1
Host: uc.qiniuapi.com
Content-Type: application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu <AccessToken>
```


### **请求参数**

[TABLE]


### **请求头**

该请求操作的实现使用了所有操作的公共请求头。有关详细信息，请查阅[公共请求头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **请求内容**

该请求操作的请求体为空。


# **响应**

### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **响应内容**

该请求操作的响应体为空。


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **示例**

### **请求示例**

``` v-md-prism-
POST /private?bucket=test06&private=1 HTTP/1.1
Host: uc.qiniuapi.com
User-Agent: Go-http-client/1.1
Content-Length: 23
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu j853F3bLkWl59I5BOkWm6q1Z1mZClpr9Z9CLfDE0:YHLW5tnhbumBI56iQ0AzJdZONSY=
Content-Type: application/x-www-form-urlencoded
Accept-Encoding: gzip
```


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Length: 2
Connection: keep-alive
Content-Type: application/json
Date: Mon, 02 Jan 2006 15:04:05 GMT
Server: nginx
X-Reqid: VBoAAJjbI4_ZmdsU

{}
```
