---
title: 获取 Bucket 空间域名
source: https://developer.qiniu.com/kodo/api/3949/get-the-bucket-space-domain
updated: 2026-01-04 15:11:36 +0800
fetched: 2026-06-18T15:34:06+00:00
category: api
---

# 获取 Bucket 空间域名

> 来源：[https://developer.qiniu.com/kodo/api/3949/get-the-bucket-space-domain](https://developer.qiniu.com/kodo/api/3949/get-the-bucket-space-domain)
> 原文更新时间：2026-01-04 15:11:36 +0800

> 获取 Bucket 空间域名

# **描述**

本接口用于获取 Bucket 的域名列表。


# **请求**

### **请求语法**

``` v-md-prism-
GET /v2/domains?tbl=<bucketName> HTTP/1.1
Host: uc.qiniuapi.com 
Content-Type: application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z  
Authorization: Qiniu <AccessToken>
```


### **请求参数**

| 参数名称 | 必填 | 说明                         |
|----------|------|------------------------------|
| tbl      | 是   | 要获取域名列表的目标空间名称 |


### **请求头**

该请求操作的实现使用了所有操作的公共请求头。有关详细信息，请查阅[公共请求头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **请求内容**

该请求操作的请求体为空。


# **响应**

### **响应语法**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Type: application/json
{
DomainName
}
```


### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-response-headers)。


### **响应内容**

[TABLE]


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **示例**

### **请求示例**

``` v-md-prism-
GET /v2/domains?tbl=test01 HTTP/1.1
Host: uc.qiniuapi.com
User-Agent: Go-http-client/1.1
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu j853F3bLkWl59I5BOkWm6q1Z1mZClpr9Z9CLfDE0:jfblnkj6JsrlxgbE3l4SfhSyiL4=
Accept-Encoding: gzip
```

*注：要在 `Authorization` 头部的 `<AccessToken>` 前添加 `Qiniu` 和半角空格。*


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Connection: keep-alive
Content-Type: application/json
Date: Mon, 02 Jan 2006 15:04:05 GMT
Server: nginx
Vary: Accept-Encoding
X-Reqid: BksAALTAQtVZhdsU

[
  "oupgm4mi4.bkt.clouddn.com", 
  "sarah.qiniudemo.com"
]
```
