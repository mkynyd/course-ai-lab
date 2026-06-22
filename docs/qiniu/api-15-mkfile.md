---
title: 创建文件
source: https://developer.qiniu.com/kodo/api/1287/mkfile
updated: 2025-11-19 17:32:01 +0800
fetched: 2026-06-18T15:34:09+00:00
category: api
---

# 创建文件

> 来源：[https://developer.qiniu.com/kodo/api/1287/mkfile](https://developer.qiniu.com/kodo/api/1287/mkfile)
> 原文更新时间：2025-11-19 17:32:01 +0800

> mkfile

**注意：不推荐。** 目前仅历史版本 sdk 使用 v1 版分片上传接口。\
**建议使用 [分片上传 v2](https://developer.qiniu.com/kodo/6364/multipartupload-interface)**

# **描述**

将上传好的所有数据块按指定顺序合并成一个资源文件。


# **请求**

### **请求语法**

``` v-md-prism-
POST /mkfile/<fileSize>/key/<encodedKey>/fname/<encodedFname>/mimeType/<encodedMimeType>/x:user-var/<encodedUserVars> HTTP/1.1
Host:           <UpHost>
Content-Type:   text/plain
Content-Length: <ctxListSize>
Authorization:  UpToken <UploadToken>

<lastCtxOfBlock1,lastCtxOfBlock2,lastCtxOfBlock3,...,lastCtxOfBlockN>
```

使用说明：

- 可以复用创建块时使用的上传凭证。
- 上传凭证将被重新验证，若已过期，可以使用重新生成的凭证。
- 若参数中指定了资源名，而所用上传策略的[scope](https://developer.qiniu.com/kodo/manual/1206/put-policy#scope)字段中也指定了资源名，且两者不一致，操作将失败且返回 401 状态码。
- 若参数与上传策略[scope](https://developer.qiniu.com/kodo/manual/1206/put-policy#scope)字段中未指定资源名，则需要使用[insertOnly](https://developer.qiniu.com/kodo/manual/1206/put-policy#put-policy-insert-only)字段，才能达到同名文件上传**不被覆盖**效果。


### **请求参数**

| 参数名称 | 必填 | 类型 | 说明 |
|----|----|----|----|
| fileSize | 是 | int64 | 资源文件大小，单位字节。 |
| encodedKey |  | string | 进行[URL 安全的 Base64 编码](https://developer.qiniu.com/kodo/manual/1231/appendix#urlsafe-base64)后的资源名。若未指定，则使用[saveKey](https://developer.qiniu.com/kodo/manual/1206/put-policy#save-key)；若未指定 saveKey，则使用资源内容的 SHA1 值作为资源名。 |
| encodedFname |  | string | 进行[URL安全的Base64编码](https://developer.qiniu.com/kodo/manual/1231/appendix#urlsafe-base64)后的文件名称。若未指定，则[魔法变量](https://developer.qiniu.com/kodo/manual/1235/vars#magicvar)中无法使用fname, ext, fprefix。 |
| encodedMimeType |  | string | 进行[URL 安全的 Base64 编码](https://developer.qiniu.com/kodo/manual/1231/appendix#urlsafe-base64)后的文件 mimeType。若未指定，则根据文件内容自动检测 mimeType。 |
| encodedUserVars |  | string | 指定[自定义变量](https://developer.qiniu.com/kodo/manual/1235/vars#xvar)，进行[URL 安全的 Base64 编码](https://developer.qiniu.com/kodo/manual/1231/appendix#urlsafe-base64)后的 user-var。 |


### **请求头**

[TABLE]


### **请求内容**

| 参数名称       | 必填 | 说明                                     |
|----------------|------|------------------------------------------|
| lastCtxOfBlock | 是   | 每个数据块最后一个数据片上传后得到的 ctx |


# **响应**

### **响应头**

该请求操作的实现使用了所有操作的公共响应头。有关详细信息，请查阅[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。


### **响应内容**

| 名称 | 说明                 |
|:-----|:---------------------|
| hash | 资源内容的 SHA1 值。 |
| key  | 实际资源名。         |


### **响应状态码**

该操作的实现不会返回特殊错误。有关错误和错误代码列表的一般信息，请查阅[错误响应](https://developer.qiniu.com/kodo/api/3928/error-responses)。
