---
title: 查询空间标签
source: https://developer.qiniu.com/kodo/api/6315/get-bucket-tagging
updated: 2025-11-05 10:54:35 +0800
fetched: 2026-06-18T15:34:07+00:00
category: api
---

# 查询空间标签

> 来源：[https://developer.qiniu.com/kodo/api/6315/get-bucket-tagging](https://developer.qiniu.com/kodo/api/6315/get-bucket-tagging)
> 原文更新时间：2025-11-05 10:54:35 +0800

> 查询空间标签API

# **描述**

本接口用于查询指定空间已设置的标签信息。


# **请求**

### **请求语法**

``` v-md-prism-
GET /bucketTagging?bucket=<BucketName> HTTP/1.1
Host: uc.qiniuapi.com
Content-Type: application/x-www-form-urlencoded
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

### **响应语法**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Type: application/json
 {
 "Tags":[{"Key":xx,"Value":xx}]
}
```


### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-response-headers)。


### **响应内容**

| 名称  | 说明     |
|-------|----------|
| Key   | 标签名称 |
| Value | 标签值   |


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **示例**

### **请求示例**

``` v-md-prism-
GET /bucketTagging?bucket=temp-bucket-jnacytgvzwpgiotaprp1z0 HTTP/1.1
Host: uc.qiniuapi.com
User-Agent: Go-http-client/1.1
Content-Length: 0
X-Qiniu-Date: 20060102T150405Z
Authorization: Qiniu HwFOxpYCQU6oXoZXFOTh1mq5ZZig6Yyocgk3BTZZ:z_ksteUK6jI_0MLAaHNEPFqrpqY=
Content-Type: application/json 
```


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Length: 2
Connection: keep-alive
Content-Type: application/json
Date: Mon, 02 Jan 2006 15:04:05 GMT
X-Reqid: rWkAAGaeqzDGrdYV

 {
    "Tags": [
        {
            "Key": "123",
            "Value": "0000"
        },
        {
            "Key": "aaaaa",
            "Value": "bbbbb"
        }
    ]
}
```
