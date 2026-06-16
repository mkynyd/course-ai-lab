# 阿里云百炼 Embedding API 文档

> 来源：https://help.aliyun.com/zh/model-studio/embedding
> 最后更新：2026-06-16

---

## 一、核心 Endpoint

### OpenAI 兼容接口（推荐）

| 地域 | Endpoint |
|---|---|
| 华北2（北京） | `https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings` |

### DashScope 原生接口

| 地域 | Endpoint |
|---|---|
| 华北2（北京） | `https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding` |

> 推荐使用 OpenAI 兼容接口，迁移成本最低。

---

## 二、文本向量模型

| 模型 | 维度 | 单条最大 Token | 单价 (元/千Token) | 语种 |
|---|---|---|---|---|
| **text-embedding-v4** (Qwen3-Embedding) | 2048/1536/**1024**(默认)/768/512/256/128/64 | 8,192 | ¥0.0005 | 100+语种 |
| text-embedding-v3 | 1024(默认)/768/512/256/128/64 | 8,192 | ¥0.0005 | 50+语种 |
| text-embedding-v2 | 1536 | 2,048 | ¥0.0007 | 中英西法葡印尼日韩德俄 |
| text-embedding-v1 | 1536 | 2,048 | ¥0.0007 | 中英西法葡印尼 |

### 免费额度

- **v4**：100 万 Token（开通后 90 天内）
- **v3/v2/v1**：各 50 万 Token（开通后 90 天内）

### 推荐

**text-embedding-v4**：最新、性能最强、支持 100+ 语种、维度可调、最便宜。

---

## 三、认证方式

```
Authorization: Bearer <DASHSCOPE_API_KEY>
```

API Key 获取：https://help.aliyun.com/zh/model-studio/get-api-key

---

## 四、调用示例

### cURL（OpenAI 兼容接口）

```bash
curl --location 'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings' \
  --header "Authorization: Bearer $DASHSCOPE_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "text-embedding-v4",
    "input": "衣服的质量杠杠的",
    "dimensions": 1024,
    "encoding_format": "float"
  }'
```

### Python（OpenAI SDK）

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

completion = client.embeddings.create(
    model="text-embedding-v4",
    input="文本内容",
    dimensions=1024,
    encoding_format="float"
)

embedding = completion.data[0].embedding
```

### Python（DashScope SDK）

```python
import dashscope
from http import HTTPStatus

dashscope.base_http_api_url = "https://dashscope.aliyuncs.com/api/v1"

resp = dashscope.TextEmbedding.call(
    model="text-embedding-v4",
    input="文本内容",
    dimension=1024
)
if resp.status_code == HTTPStatus.OK:
    print(resp)
```

### 批量文本向量化

```python
texts = ["文本一", "文本二", "文本三"]

completion = client.embeddings.create(
    model="text-embedding-v4",
    input=texts,  # 列表输入，最多 10 条
    dimensions=1024
)

vectors = [item.embedding for item in completion.data]
```

### RAG 场景（query/document 区分）

```python
# DashScope SDK 支持 text_type 参数
resp = dashscope.TextEmbedding.call(
    model="text-embedding-v4",
    input="用户的搜索查询",
    text_type="query"  # query 或 document
)
```

---

## 五、返回格式

```json
{
  "data": [
    {
      "embedding": [0.0023064255, -0.009327292, ..., -0.0028842222],
      "index": 0,
      "object": "embedding"
    }
  ],
  "model": "text-embedding-v4",
  "object": "list",
  "usage": {
    "prompt_tokens": 23,
    "total_tokens": 23
  },
  "id": "f62c2ae7-0906-9758-ab34-47c5764f07e2"
}
```

---

## 六、注意事项

1. **维度匹配**：创建向量数据库时维度必须与模型维度一致，v4 默认 1024
2. **Token 上限**：单文本不超过 8,192 Token，批量建议 ≤ 10 条
3. **API Key 安全**：使用环境变量，不要硬编码
4. **参数名差异**：OpenAI 兼容接口用 `dimensions`，DashScope SDK 用 `dimension`
5. **仅北京地域**：`dashscope.aliyuncs.com` 对应华北2（北京）
