---
title: 直传文件
source: https://developer.qiniu.com/kodo/api/1312/upload
updated: 2025-12-16 16:02:39 +0800
fetched: 2026-06-18T15:34:08+00:00
category: api
---

# 直传文件

> 来源：[https://developer.qiniu.com/kodo/api/1312/upload](https://developer.qiniu.com/kodo/api/1312/upload)
> 原文更新时间：2025-12-16 16:02:39 +0800

> 直传

# **描述**

本接口用于在一次 HTTP 会话中上传单一的一个文件。


# **请求**

### **请求语法**

请求报文的内容以`multipart/form-data`格式组织：

``` v-md-prism-
POST / HTTP/1.1
Host:           <UpHost>
Content-Type:   multipart/form-data; boundary=<Boundary>
Content-Length: <MultipartContentLength>

--<Boundary>
Content-Disposition:       form-data; name="key"

<key>
--<Boundary>
Content-Disposition:       form-data; name="x:<customName>"

<customValue>
--<Boundary>
Content-Disposition:       form-data; name="token"

<token>
--<Boundary>
Content-Disposition:       form-data; name="crc32"

<crc32>
--<Boundary>
Content-Disposition: form-data; name="x-qn-meta-<metaKey>"

<metaValue>
--<Boundary>
Content-Disposition: form-data; name="cacheControl"

<cacheControl>
--<Boundary>
Content-Disposition: form-data; name="contentLanguage"

<contentLanguage>
--<Boundary>
Content-Disposition: form-data; name="contentEncoding"

<contentEncoding>
--<Boundary>
Content-Disposition: form-data; name="contentDisposition"

<contentDisposition>
--<Boundary>
Content-Disposition: form-data; name="expires"

<expires>
--<Boundary>
Content-Disposition:       form-data; name="accept"

<accept>
--<Boundary>
Content-Disposition:       form-data; name="file"; filename="<filename>"
Content-Type:              <mimeType>
Content-Transfer-Encoding: binary

<fileContent>
--<Boundary>--
```


### **请求头**

| 头部名称 | 必填 | 说明 |
|:---|:---|:---|
| Host | 是 | 上传域名。七牛对象存储支持的区域和对应区域上传域名列表见 [存储区域列表](https://developer.qiniu.com/kodo/1671/region-endpoint-fq) |


### **请求内容**

| 参数名称 | 必填 | 说明 |
|:---|:---|:---|
| key | 否 | 资源名，必须是UTF-8编码。如果[上传凭证](https://developer.qiniu.com/kodo/manual/1208/upload-token)中 scope 指定为 \<bucket\>:\<key\>， 则该字段也必须指定，并且与上传凭证中的 key 一致，否则会报`403`错误。如果表单没有指定 key，可以使用上传策略[saveKey](https://developer.qiniu.com/kodo/manual/1206/put-policy#save-key)字段所指定魔法变量生成 Key，如果没有模板，则使用 Hash 值作为 Key。 |
| customName | 否 | [自定义变量](https://developer.qiniu.com/kodo/manual/1235/vars#xvar)的名字，不限个数。 |
| customValue | 否 | [自定义变量](https://developer.qiniu.com/kodo/manual/1235/vars#xvar)的值。 |
| token | 是 | [上传凭证](https://developer.qiniu.com/kodo/manual/1208/upload-token)，位于 token 消息中。 |
| crc32 | 否 | 上传内容的 CRC32 校验码。如果指定此值，则七牛服务器会使用此值进行内容检验。 |
| x-qn-meta- | 否 | 自定义元数据，可同时自定义多组元数据，总和大小不能超过 1024 字节。 |
| cacheControl | 否 | 指定文件下载时的缓存行为。详见 [Cache-Control](https://www.rfc-editor.org/rfc/rfc9111#section-5.2) |
| contentLanguage | 否 | 描述文件所用的语言 |
| contentEncoding | 否 | 声明文件的编码方式。必须按照文件的实际编码类型填写，否则可能造成客户端解析失败或下载失败。若文件未编码，请置空此项。详见 [Content-Encoding](https://www.rfc-editor.org/rfc/rfc9110.html#field.content-encoding) |
| contentDisposition | 否 | 指定文件的展示形式。详见 [Content-Disposition](https://www.rfc-editor.org/rfc/rfc6266#section-4) |
| expires | 否 | RFC2616 中定义的缓存失效时间。详见 [Expires](https://www.rfc-editor.org/rfc/rfc7234#section-5.3) |
| accept | 否 | 当 HTTP 请求指定 accept 头部时，七牛会返回 Content-Type 头部值。该值用于兼容低版本 IE 浏览器行为。低版本 IE 浏览器在表单上传时，返回 application/json 表示下载，返回 text/plain 才会显示返回内容。 |
| filename | 是 | 原文件名。对于没有文件名的情况，建议填入随机生成的纯文本字符串。本参数的值将作为魔法变量[\$(fname)](https://developer.qiniu.com/kodo/manual/1235/vars#magicvar-fname)的值使用。 |
| fileContent | 是 | 上传文件的完整内容。文件大小不超过 1GB。 |


# **响应**

### **响应语法**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Type: application/json
 {
 hash:"xx"
 key:"xx"
}
```


### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。

### **响应内容**

[TABLE]

### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。


# **在线示例**

- [JS表单上传（异步）](https://kodo-utils.qiniu.com/upload-token?ref=developer.qiniu.com&s_path=%2Fkodo%2F1208%2Fupload-token)
