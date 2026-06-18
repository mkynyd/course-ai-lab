---
title: 资源列举
source: https://developer.qiniu.com/kodo/api/1284/list
updated: 2025-07-21 17:42:46 +0800
fetched: 2026-06-18T15:34:11+00:00
category: api
---

# 资源列举

> 来源：[https://developer.qiniu.com/kodo/api/1284/list](https://developer.qiniu.com/kodo/api/1284/list)
> 原文更新时间：2025-07-21 17:42:46 +0800

> 文件资源的列取接口

# **描述**

本接口用于列举指定空间里的所有文件条目。


# **请求**

### **请求语法**

``` v-md-prism-
GET /list?bucket=<Bucket>&marker=<Marker>&limit=<Limit>&prefix=<UrlEncodedPrefix>&delimiter=<UrlEncodedDelimiter> HTTP/1.1
Host:           rsf.qiniuapi.com
Content-Type:   application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization:  Qiniu <AccessToken>
```


### **请求参数**

[TABLE]


### **请求头**

[TABLE]


### **请求内容**

该请求操作的请求体为空。


# **响应**

### **响应头**

| 头部名称 | 必填 | 说明 |
|:---|:---|:---|
| Content-Type | 是 | 正常情况下该值将被设为 `application/json`，表示返回 JSON 格式的文本信息。 |
| 其他 |  | 该请求实现使用了所有操作的公共响应头。详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。 |


### **响应内容**

[TABLE]


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **示例**

### **列出所有 00 打头的资源**

### **请求示例**

``` v-md-prism-
GET /list?bucket=test02&prefix=00 HTTP/1.1
Host: rsf.qiniuapi.com
User-Agent: Go-http-client/1.1
X-Qiniu-Date: 20171122T014120Z
Authorization: Qiniu j853F3bLkWl59I5BOkWm6q1Z1mZClpr9Z9CLfDE0:XvRh0ABLViTohBkgKqa0upyiug0=
Content-Type: application/x-www-form-urlencoded
Accept-Encoding: gzip
```

*注：要在`Authorization`头部的`<AccessToken>`前添加`Qiniu`和半角空格。*

### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Length: 739
Connection: keep-alive
Content-Type: application/json
Date: Wed, 22 Nov 2017 01:41:20 GMT
Server: nginx
X-Reqid: QBUAAKUcoGrgRPkU
X-Reqid: QBUAAKUcoGrgRPkU
X-Reqid: QBUAAKUcoGrgRPkU.peer

{
  "items": [
    {
      "key": "000001.pdf", 
      "hash": "Fs3oFOyOFDUp5CEODM8J6xquSq3s", 
      "fsize": 452584, 
      "mimeType": "application/pdf", 
      "putTime": 15112568720620784, 
      "md5": "e41714a18899cf59c200a9bddfa78b95",
      "type": 0, 
      "status": 0
    }, 
    {
      "key": "000002.ico", 
      "hash": "FpGrGHQOjETYnwxmSF3uXmFpmZIb", 
      "fsize": 5686, 
      "mimeType": "image/x-icon", 
      "putTime": 15112568850754920, 
      "type": 0, 
      "status": 0
    }, 
    {
      "key": "000003.png", 
      "hash": "FreZ58OmkQe5ZRUktRsO3zoqRaHi", 
      "fsize": 21741, 
      "mimeType": "image/png", 
      "putTime": 15112568948976712, 
      "type": 0, 
      "status": 0
    }, 
    {
      "key": "000004.png", 
      "hash": "FreZ58OmkQe5ZRUktRsO3zoqRaHi", 
      "fsize": 21741, 
      "mimeType": "image/png", 
      "putTime": 15112569033603324, 
      "type": 0, 
      "status": 0
    }
  ]
}
```


### **列出所有 00 打头的资源并每批 2 个**

### **请求示例**

``` v-md-prism-
GET /list?bucket=test02&prefix=00&limit=2 HTTP/1.1
Host: rsf.qiniuapi.com
User-Agent: Go-http-client/1.1
Authorization: Qiniu j853F3bLkWl59I5BOkWm6q1Z1mZClpr9Z9CLfDE0:m-2lEHcnRVwgYBqJdC5SW7groT8=
Content-Type: application/x-www-form-urlencoded
Accept-Encoding: gzip
```

*注：要在`Authorization`头部的`<AccessToken>`前添加`Qiniu`和半角空格。*

### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Length: 352
Connection: keep-alive
Content-Type: application/json
Date: Wed, 22 Nov 2017 01:46:58 GMT
Server: nginx
X-Log: TBLMGR:10;UC:21;CFGG:22;RSF:90;RSF:92;ZONEPROXY:148
X-Reqid: pEYAABGkVfAuRfkU
X-Reqid: pEYAABGkVfAuRfkU
X-Reqid: pEYAABGkVfAuRfkU.peer

{
  "marker": "eyJjIjowLCJrIjoiMDAwMDAyLmljbyJ9", 
  "items": [
    {
      "key": "000001.pdf", 
      "hash": "Fs3oFOyOFDUp5CEODM8J6xquSq3s", 
      "fsize": 452584, 
      "mimeType": "application/pdf", 
      "putTime": 15112568720620784, 
      "type": 0, 
      "status": 0
    }, 
    {
      "key": "000002.ico", 
      "hash": "FpGrGHQOjETYnwxmSF3uXmFpmZIb", 
      "fsize": 5686, 
      "mimeType": "image/x-icon", 
      "putTime": 15112568850754920, 
      "type": 0, 
      "status": 0
    }
  ]
}
```
