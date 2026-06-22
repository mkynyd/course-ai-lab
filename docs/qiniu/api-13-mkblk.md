---
title: 创建块
source: https://developer.qiniu.com/kodo/api/1286/mkblk
updated: 2025-11-19 17:33:45 +0800
fetched: 2026-06-18T15:34:08+00:00
category: api
---

# 创建块

> 来源：[https://developer.qiniu.com/kodo/api/1286/mkblk](https://developer.qiniu.com/kodo/api/1286/mkblk)
> 原文更新时间：2025-11-19 17:33:45 +0800

> mkblk

**注意：不推荐。** 目前仅历史版本 sdk 使用 v1 版分片上传接口。\
**建议使用 [分片上传 v2](https://developer.qiniu.com/kodo/6364/multipartupload-interface)**

# **描述**

本接口用于为后续分片上传创建一个新的块，同时上传第一片数据。


# **请求**

### **请求语法**

``` v-md-prism-
POST /mkblk/<blockSize> HTTP/1.1
Host:           <UpHost>
Content-Type:   application/octet-stream
Content-Length: <firstChunkSize>
Authorization:  UpToken <UploadToken>

<firstChunkBinary>
```


### **请求参数**

| 参数名称  | 必填 | 类型  | 说明                                           |
|-----------|------|-------|------------------------------------------------|
| blockSize | 是   | int64 | 块大小，每块均为 4MB，最后一块大小不超过 4MB。 |


### **请求头**

[TABLE]


### **请求内容**

| 参数名称         | 必填 | 说明                 |
|------------------|------|----------------------|
| firstChunkBinary | 是   | 第一个片的二进制内容 |


# **响应**

### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **响应内容**

| 名称 | 说明 |
|----|----|
| ctx | 本次上传成功后的块级上传控制信息，用于后续[上传片(bput)](https://developer.qiniu.com/kodo/api/1251/bput)及[创建文件(mkfile)](https://developer.qiniu.com/kodo/api/1287/mkfile)。本字段是只能被七牛服务器解读使用的不透明字段，上传端不应修改其内容。每次返回的 ctx 都只对应紧随其后的下一个上传数据片，上传非对应数据片会返回 701 状态码。例如`"ctx":"U1nAe4qJVwz4dYNslBCNNg...E5SEJJQQ=="`。 |
| checksum | 上传块 sha1，使用URL安全的Base64编码，客户可通过此字段对上传块的完整性进行校验。例如`"checksum":"wQ-csvpBHkZrhihcytio7HXizco="`。 |
| crc32 | 上传块 crc32，客户可通过此字段对上传块的完整性进行校验。例如`"crc32":659036110`。 |
| offset | 下一个上传块在切割块中的偏移。例如`"offset":4194304`。 |
| host | 后续上传接收地址。例如`"host":"http://upload.qiniup.com"`。 |
| expired_at | ctx 过期时间，ctx 过期后会删除未完成[创建文件](https://developer.qiniu.com/kodo/api/1287/mkfile)的块数据。例如`"expired_at":1514446175`。 |


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **示例**

### **请求示例**

``` v-md-prism-
POST /mkblk/4194304 HTTP/1.1
User-Agent: curl/7.30.0
Host: upload.qiniup.com
Accept: */*
Authorization: UpToken QNJi_bYJlmO5LeY08FfoNj9w_r...(过长已省略)

<firstChunkBinary>
```


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Server: nginx
Date: Thu, 21 Dec 2017 07:29:35 GMT
Content-Type: application/json
Connection: keep-alive
Cache-Control: no-store
Content-Length: 340
X-Log: qtbl.get;RS
X-Reqid: swEAAMipp-5bIjMT

{
  ctx: "U1nAe4qJVwz4dYNslBCNNgE...PMXE5SEJJQQ==", 
  checksum: "wQ-csvpBHkZrhihcytio7HXizco=", 
  crc32: 659036110, 
  offset: 4194304, 
  host: "http://upload.qiniup.com", 
  expired_at: 1514446175
}
```
