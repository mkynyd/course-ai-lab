# MinerU Agent Lightweight Extract API（Agent 轻量解析 API）

> Base URL: `https://mineru.net`
> Auth: **无需认证**（IP 限频防滥用）
> 专为 OpenClaw 等 AI Agent 场景设计

## 约束

- 文件大小 ≤ 10MB
- 页数 ≤ 20 页
- 不支持批量上传，每次请求只能上传一个文件
- 每个 IP 每分钟有请求提交限制，超出返回 HTTP 429

## 模型策略

- **PDF、图片**：使用 pipeline 轻量模型，禁用表格/公式识别，追求最快解析速度
- **Word、PPT**：使用 Office 原生 API 解析

## 输出

- 仅输出 **Markdown** 格式
- 返回 CDN 下载链接

---

## 1. URL 解析

提交远程文件 URL 进行解析。

```
POST /api/v1/agent/parse/url
Content-Type: application/json
```

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `url` | string | **是** | — | 远程文件 URL，支持 PDF/图片/Doc/Docx/PPT/PPTx/Xlsx。不支持 HTML |
| `file_name` | string | 否 | — | 文件名（含扩展名），不提供则从 URL 自动解析 |
| `language` | string | 否 | `ch` | 文档语言（仅 PDF 有效） |
| `enable_table` | bool | 否 | `true` | 启用表格识别（仅 PDF 有效） |
| `is_ocr` | bool | 否 | `false` | 启用 OCR（仅 PDF 有效） |
| `enable_formula` | bool | 否 | `true` | 启用公式识别（仅 PDF 有效） |
| `page_range` | string | 否 | — | 页码范围（仅 PDF），格式：`"1-10"` 或单页 `"5"`，不支持逗号分隔 |

### 响应

```json
{
  "code": 0,
  "data": { "task_id": "a90e6ab6-44f3-4554-b459-b62fe4c6b436" },
  "msg": "ok",
  "trace_id": "..."
}
```

### CURL 示例

```bash
curl --location --request POST 'https://mineru.net/api/v1/agent/parse/url' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
    "file_name": "example.pdf",
    "language": "ch",
    "enable_table": true,
    "is_ocr": false,
    "enable_formula": true,
    "page_range": "1-10"
  }'
```

### Python 示例

```python
import requests

url = "https://mineru.net/api/v1/agent/parse/url"
payload = {
    "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
    "file_name": "example.pdf",
    "language": "ch",
    "page_range": "1-10"
}

response = requests.post(url, json=payload)
result = response.json()
print(result)
```

---

## 2. 文件上传解析（签名上传）

通过签名 URL 上传本地文件，后端自动检测并开始解析。

```
POST /api/v1/agent/parse/file
Content-Type: application/json
```

### 流程

1. POST 请求获取 `task_id` 和 OSS 签名上传 URL
2. PUT 文件二进制到签名 URL
3. 上传完成后系统自动提交解析，无需手动触发

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file_name` | string | **是** | 文件名（含扩展名），用于判断文件类型 |

**注意**：该接口不支持直接在请求体中上传文件（不支持 multipart/form-data）。上传文件时无需设置 Content-Type 请求头。

### 响应

```json
{
  "code": 0,
  "data": {
    "task_id": "a90e6ab6-44f3-4554-b459-b62fe4c6b436",
    "file_url": "https://oss-mineru.../agent/a90e6ab6-...pdf"
  },
  "msg": "ok",
  "trace_id": "..."
}
```

### CURL 示例

```bash
# Step 1: 获取签名上传 URL
curl --location --request POST 'https://mineru.net/api/v1/agent/parse/file' \
  --header 'Content-Type: application/json' \
  --data-raw '{"file_name": "example.pdf"}'

# Step 2: PUT 上传文件
curl -X PUT -T /path/to/your/file.pdf 'https://oss-mineru.../agent/...'
```

---

## 3. 查询解析结果

```
GET /api/v1/agent/parse/{task_id}
```

### 任务状态

| 状态 | 说明 |
|---|---|
| `waiting-file` | 等待文件上传（仅文件上传模式） |
| `uploading` | 文件下载中 |
| `pending` | 排队中 |
| `running` | 解析中 |
| `done` | 完成 — `markdown_url` 字段返回 CDN 链接 |
| `failed` | 失败 — `err_msg` 和 `err_code` 字段有值 |

### 响应示例（完成）

```json
{
  "code": 0,
  "data": {
    "state": "done",
    "markdown_url": "https://cdn-mineru.openxlab.org.cn/pdf/018e53ad-d4f1-475d-b380-36bf24db9914/full.md"
  },
  "msg": "ok",
  "trace_id": "..."
}
```

### 响应示例（等待文件上传 — 仅文件上传模式）

```json
{
  "code": 0,
  "data": {
    "state": "waiting-file"
  },
  "msg": "ok",
  "trace_id": "..."
}
```

### 响应示例（失败）

```json
{
  "code": 0,
  "data": {
    "state": "failed",
    "err_code": "-30001",
    "err_msg": "file size exceeds lightweight API limit (10MB)"
  },
  "msg": "ok",
  "trace_id": "..."
}
```

### CURL 示例

```bash
curl --location --request GET 'https://mineru.net/api/v1/agent/parse/{task_id}'
```

---

## 4. Agent 专用错误码

| 错误码 | 说明 | 建议操作 |
|---|---|---|
| `-30001` | 文件超过 10MB 限制 | 使用 Precision API 或拆分文件 |
| `-30002` | 不支持的文件类型 | 使用 PDF/图片/Docx/PPTx/Xlsx |
| `-30003` | 页数超出限制 | 使用 Precision API 或指定 `page_range` |
| `-30004` | 请求参数无效 | 检查必填字段 |

---

## 与 Precision API 的关键区别

1. **无认证**：不需要 Token，适合 AI Agent 快速集成
2. **轻量化**：牺牲精度换速度，禁用表格和公式识别
3. **无批量**：每次只能处理单文件
4. **仅 MD**：不输出 JSON 等结构化格式
5. **有大小限制**：≤10MB / ≤20 页，大文件需用 Precision API
6. **返回 CDN 链接**：直接下载 Markdown 文件，而非 ZIP 包
