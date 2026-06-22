---
title: 完成文件上传
source: https://developer.qiniu.com/kodo/api/6368/complete-multipart-upload
updated: 2025-12-16 16:04:56 +0800
fetched: 2026-06-18T15:34:10+00:00
category: api
---

# 完成文件上传

> 来源：[https://developer.qiniu.com/kodo/api/6368/complete-multipart-upload](https://developer.qiniu.com/kodo/api/6368/complete-multipart-upload)
> 原文更新时间：2025-12-16 16:04:56 +0800

> 完成整个文件MultipartUpload API

# **描述**

在将所有数据 Part 都上传完成后，必须调用 completeMultipartUpload API 来完成整个文件的 Multipart Upload。用户需要提供有效数据的 Part 列表（ 包括 PartNumber 和调用 uploadPart API 服务端返回的 Etag ）。服务端收到用户提交的 Part 列表后，会逐一验证每个数据 Part 的有效性。当所有的数据 Part 验证通过后，会把这些数据 Part 组合成一个完整的 Object。


# **请求**

### **请求语法**

``` v-md-prism-
POST /buckets/<BucketName>/objects/<EncodedObjectName>/uploads/<UploadId> HTTP/1.1
Host: <UpHost>
Content-Type: application/json
Authorization: UpToken <UploadToken>

{
    "parts": [{ "etag": "<Etag>", "partNumber": <PartNumber> }, ...],
    "fname": "<Fname>",
    "mimeType": "<MimeType>",
    "metadata": {"x-qn-meta-<MetaKey>": "<MetaValue>", ...},
    "customVars": {"x:<CustomVarKey>": "<CustomVarValue>", ...},
    "cacheControl": "<CacheControl>",
    "contentLanguage": "<ContentLanguage>",
    "contentDisposition": "<ContentDisposition>",
    "contentEncoding": "<ContentEncoding>",
    "expires": "<Expires>"
}
```

使用说明：

- completeMultipartUpload 时会确认除最后一块以外所有块的大小是否都大于等于 1 MB ，并检查用户提交的 Part 列表中的每一个 PartNumber 和 Etag 。
- 用户提交的 Part 列表中，Part 号码可以不连续，但必须是升序。
- 服务端处理 completeMultipartUpload 请求成功后，该 UploadId 就会变成无效，再次请求与该 UploadId 相关操作都会失败。


### **请求参数**

| 参数名称 | 必填 | 说明 |
|----|----|----|
| BucketName | 是 | 空间名称 |
| EncodedObjectName | 否 | 资源名，EncodedObjectName 需要经过 Base64 编码。具体可以参照：[URL 安全的 Base64 编码](https://developer.qiniu.com/kodo/manual/1231/appendix#urlsafe-base64) |
| UploadId | 是 | 在服务端申请的 MultipartUpload 任务 id |


### **请求头**

| 头部名称 | 必填 | 说明 |
|----|----|----|
| Host | 是 | 上传域名。七牛对象存储支持的区域和对应区域上传域名列表见 [存储区域列表](https://developer.qiniu.com/kodo/1671/region-endpoint-fq) |
| Authorization | 是 | 该参数应严格按照[上传凭证](https://developer.qiniu.com/kodo/manual/1208/upload-token)格式进行填充，否则会返回 401 错误码。一个合法的 Authorization 值应类似于 Authorization: UpToken QNJi_bYJlmO5LeY08FfoNj9w_r… |
| Content-Type | 是 | 固定为 `application/json` |


### **请求内容**

| 参数名称 | 类型 | 必填 | 说明 |
|----|----|----|----|
| parts | Array | 是 | 已经上传 Part 列表 （ 包括 PartNumber （ int ）和调用 uploadPart API 服务端返回的 Etag （ string ）） |
| fname | string | 否 | 上传的原始文件名， 若未指定，则魔法变量中无法使用 fname，ext，suffix |
| mimeType | string | 否 | 若指定了则设置上传文件的 mimeType， 若未指定，则根据文件内容自动检测 mimeType |
| metadata | \- | 否 | 用户自定义文件 metadata 信息的 key 和 value， 可以设置多个，MetaKey 和 MetaValue 都是 string，其中 可以由字母、数字、下划线、减号组成，且长度小于等于 50，单个文件 MetaKey 和 Metavalue 总和大小不能超过 1024 字节 |
| customVars | \- | 否 | [用户自定义变量](https://developer.qiniu.com/kodo/manual/1235/vars)，CustomVarKey 和 CustomVarValue 都是 string |
| cacheControl | string | 否 | 指定文件下载时的缓存行为。详见 [Cache-Control](https://www.rfc-editor.org/rfc/rfc9111#section-5.2) |
| contentLanguage | string | 否 | 描述文件所用的语言 |
| contentEncoding | string | 否 | 声明文件的编码方式。必须按照文件的实际编码类型填写，否则可能造成客户端解析失败或下载失败。若文件未编码，请置空此项。详见 [Content-Encoding](https://www.rfc-editor.org/rfc/rfc9110.html#field.content-encoding) |
| contentDisposition | string | 否 | 指定文件的展示形式。详见 [Content-Disposition](https://www.rfc-editor.org/rfc/rfc6266#section-4) |
| expires | string | 否 | RFC2616 中定义的缓存失效时间。详见 [Expires](https://www.rfc-editor.org/rfc/rfc7234#section-5.3) |


# **响应**

### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-response-headers)。


### **响应内容**

| 名称 | 类型   | 说明                                 |
|------|--------|--------------------------------------|
| key  | string | 资源名称                             |
| hash | string | 目标资源的 hash 值，可用于 Etag 头部 |


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。

### **上传策略特殊说明**

该操作的实现不支持上传策略中 " returnUrl " ，请查阅[上传策略](https://developer.qiniu.com/kodo/manual/1206/put-policy)。


# **示例**

### **请求示例**

``` v-md-prism-
POST /buckets/myBucket/objects/bXlPYmplY3Q=/uploads/myUploadId HTTP/1.1
Host: up.qiniup.com
Content-Type: application/json
Authorization: UpToken <UploadToken>

{
    "parts": [
        {
            "partNumber": 1,
            "etag": "FqvtxHpe3j-rEzkImMUWDsmvu27D"
        }
    ],
    "mimeType": ""
}
```


### **响应示例**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Length: 2
Connection: keep-alive
Content-Type: application/json
Date: Wed, 18 Dec 2019 17:02:11 GMT
Server: nginx
X-Reqid: SFkAAAC8BDebTtsU

{
    "hash": "FqvtxHpe3j-rEzkImMUWDsmvu27D",
    "key": "myObject"
}
```
