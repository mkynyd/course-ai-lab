# MinerU Precision Extract API（精准解析 API）

> Base URL: `https://mineru.net`
> Auth: `Authorization: Bearer <token>`
> 每日额度：1000 页最高优先级，超出部分优先级降低

## 约束

- 文件大小 ≤ 200MB
- 页数 ≤ 200 页
- 因网络限制，GitHub、AWS 等国外 URL 可能超时

---

## 1. 单文件 URL 解析

提交远程文件 URL 进行解析，后端自动下载并解析文件。

### 创建任务

```
POST /api/v4/extract/task
Content-Type: application/json
```

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `url` | string | **是** | — | 文件 URL，支持 .pdf/.doc/.docx/.ppt/.pptx/.xls/.xlsx/图片/.html |
| `model_version` | string | 否 | `pipeline` | `pipeline` / `vlm` / `MinerU-HTML` |
| `is_ocr` | bool | 否 | `false` | 启用 OCR（仅 pipeline/vlm） |
| `enable_formula` | bool | 否 | `true` | 启用公式识别（仅 pipeline/vlm；vlm 仅影响行内公式） |
| `enable_table` | bool | 否 | `true` | 启用表格识别（仅 pipeline/vlm） |
| `language` | string | 否 | `ch` | 文档语言代码（见概览文档） |
| `data_id` | string | 否 | — | 业务数据 ID，字母/数字/`_`/`-`/`.`，≤128 字符 |
| `callback` | string | 否 | — | 回调 URL（HTTP/HTTPS，POST，UTF-8，Content-Type: application/json） |
| `seed` | string | 否 | — | 回调签名随机字符串（字母/数字/`_`，≤64 字符），使用 callback 时必填 |
| `extra_formats` | [string] | 否 | — | 额外输出格式：`"docx"` `"html"` `"latex"`（MD+JSON 默认包含），对 HTML 源文件无效 |
| `page_ranges` | string | 否 | — | 逗号分隔的页码范围，如 `"2,4-6"` 或 `"2--2"`（第 2 页到倒数第 2 页） |
| `no_cache` | bool | 否 | `false` | 绕过 URL 内容缓存 |
| `cache_tolerance` | int | 否 | `900` | 缓存容忍时间（秒），no_cache=false 时有效 |

#### 响应示例

```json
{
  "code": 0,
  "data": { "task_id": "a90e6ab6-44f3-4554-b459-b62fe4c6b436" },
  "msg": "ok",
  "trace_id": "..."
}
```

#### CURL 示例（PDF/Doc/PPT/Excel/图片）

```bash
curl --location --request POST 'https://mineru.net/api/v4/extract/task' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <your_token>' \
  --data-raw '{
    "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
    "model_version": "pipeline",
    "is_ocr": false,
    "enable_formula": true,
    "enable_table": true,
    "language": "ch"
  }'
```

#### CURL 示例（HTML 文件）

```bash
curl --location --request POST 'https://mineru.net/api/v4/extract/task' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <your_token>' \
  --data-raw '{
    "url": "https://example.com/page.html",
    "model_version": "MinerU-HTML"
  }'
```

#### Python 示例（PDF/Doc/PPT/Excel/图片）

```python
import requests

url = "https://mineru.net/api/v4/extract/task"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer <your_token>"
}
payload = {
    "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
    "model_version": "pipeline",
    "is_ocr": False,
    "enable_formula": True,
    "enable_table": True,
    "language": "ch"
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()
print(result)
```

#### Python 示例（HTML 文件）

```python
import requests

url = "https://mineru.net/api/v4/extract/task"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer <your_token>"
}
payload = {
    "url": "https://example.com/page.html",
    "model_version": "MinerU-HTML"
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()
print(result)
```

---

### 查询任务结果

```
GET /api/v4/extract/task/{task_id}
Authorization: Bearer <token>
```

#### 响应字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `data.state` | string | `done` / `pending` / `running` / `failed` / `converting` |
| `data.full_zip_url` | string | 解析结果 ZIP 包下载链接（state=done 时） |
| `data.err_msg` | string | 失败原因（state=failed 时） |
| `data.err_code` | string | 错误码（state=failed 时） |
| `data.extract_progress.extracted_pages` | int | 已解析页数（state=running 时） |
| `data.extract_progress.total_pages` | int | 总页数（state=running 时） |
| `data.extract_progress.start_time` | string | 解析开始时间（state=running 时） |
| `data.data_id` | string | 回显提交时的 data_id |

#### 响应示例（完成）

```json
{
  "code": 0,
  "data": {
    "state": "done",
    "full_zip_url": "https://cdn-mineru.openxlab.org.cn/pdf/018e53ad-d4f1-475d-b380-36bf24db9914.zip",
    "data_id": "my_custom_id"
  },
  "msg": "ok",
  "trace_id": "..."
}
```

#### 响应示例（处理中）

```json
{
  "code": 0,
  "data": {
    "state": "running",
    "extract_progress": {
      "extracted_pages": 5,
      "total_pages": 20,
      "start_time": "2024-01-01T00:00:00Z"
    }
  },
  "msg": "ok",
  "trace_id": "..."
}
```

#### 响应示例（失败）

```json
{
  "code": 0,
  "data": {
    "state": "failed",
    "err_code": "-60010",
    "err_msg": "parse failed"
  },
  "msg": "ok",
  "trace_id": "..."
}
```

#### CURL 示例

```bash
curl --location --request GET 'https://mineru.net/api/v4/extract/task/a90e6ab6-44f3-4554-b459-b62fe4c6b436' \
  --header 'Authorization: Bearer <your_token>'
```

---

## 2. 批量文件解析（本地文件上传）

通过签名 URL 上传本地文件，系统自动提交解析任务。最多 50 个文件/请求。

### 获取签名上传 URL

```
POST /api/v4/file-urls/batch
Content-Type: application/json
Authorization: Bearer <token>
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `files` | array | **是** | 文件对象数组 |
| `files[].name` | string | **是** | 文件名（含扩展名），强烈建议带上正确后缀 |
| `files[].data_id` | string | 否 | 自定义业务数据 ID |
| `files[].is_ocr` | bool | 否 | 启用 OCR |
| `files[].page_ranges` | string | 否 | 页码范围 |
| `enable_formula` | bool | 否 | 全局公式开关 |
| `enable_table` | bool | 否 | 全局表格开关 |
| `language` | string | 否 | 全局语言设置 |
| `model_version` | string | 否 | 模型选择 |
| `callback` | string | 否 | 回调 URL |
| `seed` | string | 否 | 回调签名种子 |
| `extra_formats` | [string] | 否 | 额外输出格式 |

#### 响应

返回 `batch_id` 和签名上传 URL 数组。上传 URL 有效期 **24 小时**。

#### Python 完整签名上传流程示例

```python
import requests
import json

token = "<your_token>"
base_url = "https://mineru.net"

# Step 1: 获取签名上传 URL
files_payload = {
    "files": [
        {"name": "document1.pdf"},
        {"name": "document2.docx", "is_ocr": True}
    ],
    "enable_formula": True,
    "enable_table": True,
    "language": "ch",
    "model_version": "pipeline"
}

response = requests.post(
    f"{base_url}/api/v4/file-urls/batch",
    json=files_payload,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
)
result = response.json()
print(f"batch_id: {result['data']['batch_id']}")

# Step 2: PUT 上传文件到签名 URL
for file_info in result['data']['file_urls']:
    file_name = file_info['file_name']
    upload_url = file_info['upload_url']
    
    with open(f"/path/to/{file_name}", 'rb') as f:
        upload_response = requests.put(upload_url, data=f)
    
    if upload_response.status_code == 200:
        print(f"Uploaded {file_name} successfully")

# Step 3: 系统自动提交解析任务，无需手动触发
```

---

## 3. 批量文件解析（URL 批量提交）

```
POST /api/v4/extract/task/batch
Content-Type: application/json
Authorization: Bearer <token>
```

最多 50 个 URL/请求。

#### 请求参数

参数结构与本地批量上传相同，但 `files[].url`（必填）替代 `files[].name`。额外支持 `no_cache` 和 `cache_tolerance`。

#### 响应

返回 `batch_id`。文件无需单独上传。

---

## 4. 查询批量解析结果

```
GET /api/v4/extract-results/batch/{batch_id}
Authorization: Bearer <token>
```

#### 响应字段

返回 `batch_id` + `extract_result` 数组，每个元素包含：

| 字段 | 说明 |
|---|---|
| `file_name` | 文件名 |
| `state` | 状态：done/pending/running/failed/converting |
| `full_zip_url` | 结果下载链接 |
| `err_msg` | 错误信息 |
| `data_id` | 业务数据 ID |
| `extract_progress` | 解析进度（state=running 时） |

---

## 5. 回调机制

解析完成后，MinerU 向 `callback` URL 发送 POST 请求：

- **Content-Type**: `application/json`
- **编码**: UTF-8
- **重试**: 最多 5 次，间隔递增，5 次后停止
- **成功判定**: 回调接口返回 HTTP 200

### 回调参数

| 参数 | 说明 |
|---|---|
| `checksum` | `SHA256(uid + seed + content)`，用于校验请求来源。UID 在个人中心查询 |
| `content` | JSON 字符串，内容结构与任务查询结果的 `data` 字段一致 |

---

## 6. 错误码

| 错误码 | 说明 | 建议操作 |
|---|---|---|
| `A0202` | Token 错误 | 检查 Bearer 前缀或更换 Token |
| `A0211` | Token 已过期 | 更换新 Token |
| `-500` | 参数错误 | 检查参数类型和 Content-Type |
| `-10001` | 服务异常 | 稍后重试 |
| `-10002` | 请求参数错误 | 检查请求格式 |
| `-60001` | 上传 URL 生成失败 | 稍后重试 |
| `-60002` | 文件格式检测失败 | 确保文件名含正确后缀，文件为支持类型 |
| `-60003` | 文件读取失败 | 检查文件完整性，重新上传 |
| `-60004` | 文件为空 | 上传有效文件 |
| `-60005` | 文件大小超限 | 最大 200MB |
| `-60006` | 页数超限 | 拆分文件 |
| `-60007` | 模型服务不可用 | 稍后重试或联系技术支持 |
| `-60008` | 文件读取超时 | 检查 URL 可访问性 |
| `-60009` | 队列已满 | 稍后重试 |
| `-60010` | 解析失败 | 稍后重试 |
| `-60011` | 文件未找到 | 确认上传完成 |
| `-60012` | 任务未找到 | 检查 task_id 有效性 |
| `-60013` | 权限拒绝 | 只能访问自己提交的任务 |
| `-60014` | 无法删除运行中任务 | 等待任务完成 |
| `-60015` | 文件转换失败 | 手动转换为 PDF 后重试 |
| `-60016` | 格式导出失败 | 尝试其他格式或重试 |
| `-60017` | 重试次数已达上限 | 等待模型升级 |
| `-60018` | 每日任务额度已用完 | 次日重试 |
| `-60019` | HTML 解析配额已用完 | 次日重试 |
| `-60020` | 文件拆分失败 | 稍后重试 |
| `-60021` | 页数读取失败 | 稍后重试 |
| `-60022` | 网页读取失败 | 网络/限频问题，稍后重试 |
