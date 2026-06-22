---
title: 批量操作
source: https://developer.qiniu.com/kodo/api/1250/batch
updated: 2022-06-10 12:01:53 +0800
fetched: 2026-06-18T15:34:13+00:00
category: api
---

# 批量操作

> 来源：[https://developer.qiniu.com/kodo/api/1250/batch](https://developer.qiniu.com/kodo/api/1250/batch)
> 原文更新时间：2022-06-10 12:01:53 +0800

> 批量操作（batch）接口文档

# **描述**

本接口用于执行批量操作。\
批量操作意指在单一请求中执行多次（最大限制1000次） [查询元信息](https://developer.qiniu.com/kodo/api/1308/stat)、[修改元信息](https://developer.qiniu.com/kodo/api/1252/chgm)、[移动](https://developer.qiniu.com/kodo/api/1288/move)、[复制](https://developer.qiniu.com/kodo/api/1254/copy)、[删除](https://developer.qiniu.com/kodo/api/1257/delete)、[修改状态](https://developer.qiniu.com/kodo/api/4173/modify-the-file-status)、[修改存储类型](https://developer.qiniu.com/kodo/api/3710/chtype)、[修改生命周期](https://developer.qiniu.com/kodo/api/8062/modify-object-life-cycle) 和 [解冻](https://developer.qiniu.com/kodo/api/6380/restore-archive) 操作，极大提高资源管理效率。 其中，解冻操作仅针对归档/深度归档存储文件有效。


# **请求**

### **请求语法**

``` v-md-prism-
POST /batch HTTP/1.1
Host:           rs.qiniuapi.com
Content-Type:   application/x-www-form-urlencoded
X-Qiniu-Date: 20060102T150405Z
Authorization:  Qiniu <AccessToken>

op=<Operation>&op=<Operation>&...
```

使用说明：

- 要在 Authorization 头部的 `<AccessToken>` 前添加 Qiniu 和半角空格。
- `op=<Operation>` 是单一文件管理指令（如：`/stat/<EncodeEntryURI>`，`/delete/<EncodeEntryURI>` 等）。


### **请求参数**

将根据具体 `op=<Operation>` 文件管理指令，使用相应参数。\
常用参数 `EncodeEntryURI`、`EncodedEntryURISrc` 与 `EncodedEntryURIDest` 经过 Base64 编码，具体请参考 请参考[EncodedEntryURI](https://developer.qiniu.com/kodo/api/1276/data-format)。


### **请求头**

[TABLE]


### **请求内容**

``` v-md-prism-
#批量获取元信息
op=/stat/<EncodedEntryURI>&op=/stat/<EncodedEntryURI>&...

#批量复制资源
op=/copy/<EncodedEntryURISrc>/<EncodedEntryURIDest>&op=/copy/<EncodedEntryURISrc>/<EncodedEntryURIDest>&.../force/<true|false> 

#批量移动资源
op=/move/<EncodedEntryURISrc>/<EncodedEntryURIDest>&op=/move/<EncodedEntryURISrc>/<EncodedEntryURIDest>&.../force/<true|false> 

#批量删除资源
op=/delete/<EncodedEntryURI>&op=/delete/<EncodedEntryURI>&...
    
#批量解冻资源
op=/restoreAr/<EncodedEntryURI>/freezeAfterDays/<FreezeAfterDays>&...

#批量修改元信息
……
#批量修改存储类型
……
#批量修改状态
……
#批量修改生命周期
……

#混合多种操作
op=/stat/<EncodedEntryURI>&op=/copy/<EncodedEntryURISrc>/<EncodedEntryURIDest>/force/<true|false>&op=/move/<EncodedEntryURISrc>/<EncodedEntryURIDest>/force/<true|false> &op=/delete/<EncodedEntryURI>&op=/restoreAr/<EncodedEntryURI>/freezeAfterDays/<FreezeAfterDays>&...
```

*注：copy 和 move 操作需为每个文件指定force参数。*


# **响应**

### **响应语法**

``` v-md-prism-
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
```


### **响应头**

| 头部名称 | 必填 | 说明 |
|:---|:---|:---|
| Content-Type | 是 | 正常情况下该值将被设为 `application/json`，表示返回 JSON 格式的文本信息。 |
| 其他 |  | 其它可能返回的头部信息，请参考[公共响应头](https://developer.qiniu.com/kodo/api/3924/common-request-headers)。 |


### **响应内容**

``` v-md-prism-
#批量获取元信息
[
    { "code": <HttpCode int>, "data": <Data> },
    { "code": <HttpCode int>, "data": <Data> },
    { "code": <HttpCode int>, "data": { "error": "<ErrorMessage string>" } },
    ...
]

#批量复制资源
[
    { "code": <HttpCode int> },
    { "code": <HttpCode int> },
    { "code": <HttpCode int>, "data": { "error": "<ErrorMessage string>" } },
    ...
]

#批量移动资源
[
    { "code": <HttpCode int> },
    { "code": <HttpCode int> },
    { "code": <HttpCode int>, "data": { "error": "<ErrorMessage string>" } },
    ...
]

#批量删除资源
[
    { "code": <HttpCode int> },
    { "code": <HttpCode int> },
    { "code": <HttpCode int>, "data": { "error": "<ErrorMessage string>" } },
    ...
]
    
#批量解冻资源
[
    { "code": <HttpCode int> },
    { "code": <HttpCode int> },
    { "code": <HttpCode int>, "data": { "error": "<ErrorMessage string>" } },
    ...
]

#混合多种操作
[
    { "code": <HttpCode int>, "data": <Data> },
    { "code": <HttpCode int> },
    { "code": <HttpCode int> },
    { "code": <HttpCode int> },
    { "code": <HttpCode int>, "data": { "error": "<ErrorMessage string>" } },
    ...
]
```


### **响应状态码**

[TABLE]

如遇 599 错误，请将完整错误信息（包括所有 HTTP 响应头部）[提交工单](https://support.qiniu.com/tickets/category) 给我们。
