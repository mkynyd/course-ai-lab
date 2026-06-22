---
title: 上传片
source: https://developer.qiniu.com/kodo/api/1251/bput
updated: 2025-11-19 17:33:38 +0800
fetched: 2026-06-18T15:34:08+00:00
category: api
---

# 上传片

> 来源：[https://developer.qiniu.com/kodo/api/1251/bput](https://developer.qiniu.com/kodo/api/1251/bput)
> 原文更新时间：2025-11-19 17:33:38 +0800

> bput

**注意：不推荐。** 目前仅历史版本 sdk 使用 v1 版分片上传接口。\
**建议使用 [分片上传 v2](https://developer.qiniu.com/kodo/6364/multipartupload-interface)**

# **描述**

上传指定块的一片数据，具体数据量可根据现场环境调整。同一块的每片数据必须串行上传。


# **请求**

### **请求语法**

``` v-md-prism-
POST /bput/<ctx>/<nextChunkOffset> HTTP/1.1
Host:           <UpHost>
Content-Type:   application/octet-stream
Content-Length: <nextChunkSize>
Authorization:  UpToken <UploadToken>

<nextChunkBinary>
```

使用说明：

- 可以复用创建块时使用的[上传凭证](https://developer.qiniu.com/kodo/manual/1208/upload-token)。
- 上传凭证将被重新验证，若已过期，可以使用重新生成的凭证。


### **请求参数**

| 参数名称        | 必填 | 类型   | 说明                               |
|-----------------|------|--------|------------------------------------|
| ctx             | 是   | string | 前一次上传返回的块级上传控制信息。 |
| nextChunkOffset | 是   | int64  | 当前片在整个块中的起始偏移。       |


### **请求头**

[TABLE]


### **请求内容**

| 参数名称        | 必填 | 说明               |
|-----------------|------|--------------------|
| nextChunkBinary | 是   | 当前片的二进制内容 |


# **响应**

### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **响应内容**

| 名称 | 说明 |
|----|----|
| ctx | 本次上传成功后的块级上传控制信息，用于后续[上传片(bput)](https://developer.qiniu.com/kodo/api/1251/bput)及[创建文件(mkfile)](https://developer.qiniu.com/kodo/api/1287/mkfile)。本字段是只能被七牛服务器解读使用的不透明字段，上传端不应修改其内容。每次返回的 ctx 都只对应紧随其后的下一个上传数据片，上传非对应数据片会返回 701 状态码。例如`"ctx":"U1nAe4qJVwz4dYNslBCNNg...E5SEJJQQ=="`。 |
| checksum | 上传块校验码。例如`"checksum":"wQ-csvpBHkZrhihcytio7HXizco="`。 |
| crc32 | 上传块 crc32，客户可通过此字段对上传块的完整性进行校验。例如`"crc32":659036110`。 |
| offset | 下一个上传片在上传块中的偏移。例如`"offset":4194304`。 |
| host | 后续上传接收地址。例如`"host":"http://upload.qiniup.com"`。 |
| expired_at | ctx 过期时间，ctx 过期后会删除未完成[创建文件](https://developer.qiniu.com/kodo/api/1287/mkfile)的块数据。例如`"expired_at":1514446175`。 |


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。
