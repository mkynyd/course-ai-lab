---
title: Agent 场景中的 Markdown 最佳实践
source: https://developer.qiniu.com/kodo/13372/html2markdown-ai
updated: 2026-05-19 18:48:05 +0800
fetched: 2026-06-18T15:34:05+00:00
category: best-practice
---

# Agent 场景中的 Markdown 最佳实践

> 来源：[https://developer.qiniu.com/kodo/13372/html2markdown-ai](https://developer.qiniu.com/kodo/13372/html2markdown-ai)
> 原文更新时间：2026-05-19 18:48:05 +0800

> 介绍对象存储在 Agent 场景下的应用

# **为什么需要 Markdown**

大语言模型（LLM）的推理成本与输入 Token 数量直接相关。Web 内容的主要格式是 HTML，但 HTML 对 AI 而言存在两个根本性问题：

- **Token 浪费严重**：HTML 标签本身不携带语义，却消耗大量 Token。
- **噪声干扰推理质量**：HTML 页面中混杂着导航栏、广告、Cookie 提示、内联 CSS/JS 等与内容无关的结构，这些"噪声"会分散模型注意力，降低问答和摘要的准确率。

Markdown 已成为 AI Agent 的**通用语言**：结构清晰、语义明确、Token 高效，是目前 RAG（检索增强生成）、文档问答、内容摘要等场景的首选输入格式。

# **对象存储 Kodo 支持 HTML2Markdown 转换**

支持两种姿势：

| 使用方式 | 适用场景 |
|----|----|
| [HTML2Markdown 自适应](https://developer.qiniu.com/kodo/development_guidelines/13373/auto-html2md) | 存量 HTML 文件批量转换、AI 抓取 |
| [html2md 数据处理命令](https://developer.qiniu.com/dora/api/13341/html2md) | 流水线处理、管道组合、按需转换 |

# **在 Agent 常见场景中的使用**

## **RAG 知识库构建**

将 **HTML2Markdown 自适应**和 **html2md 数据处理命令**结合使用：入库时触发 html2md 预转换，检索时直接消费 Markdown，两个阶段均无额外延迟。

``` v-md-prism-
────────────────────────────────────────────────────────
数据入库阶段
  网页抓取 / 文档上传
      ↓                                                
  HTML 文件存入 Kodo (html-bucket)                        
      ↓                                                 
  触发 pfop: html2md|saveas(markdown-bucket)              
      ↓                                                 
  Markdown 文件落盘 (markdown-bucket)                     
────────────────────────────────────────────────────────
                          ↓
────────────────────────────────────────────────────────
Embedding 阶段                                                                                                
  读取 markdown-bucket 中的 .md 文件                      
      ↓                                                 
  按标题层级（# ## ###）切分 chunk  ← 语义边界天然清晰    
      ↓                                                 
  Embedding 模型向量化                                    
      ↓                                                 
  写入向量数据库/向量空间                                          
────────────────────────────────────────────────────────
                          ↓
────────────────────────────────────────────────────────
检索推理阶段                                                                                              
  用户提问 → 向量检索 → 召回 Markdown chunk              
       ↓                                                 
  拼装 Prompt（Token 节省 80%）                           
       ↓                                                 
  LLM 推理 → 回答                                        
────────────────────────────────────────────────────────
```

**chunk 切分建议**：Markdown 标题（`#` `##` `###`）是天然的语义边界，优于基于字符数的硬切分。

## **实时文档问答**

对于用户上传的 HTML 文件或提供的网页 URL，使用 HTML2Markdown 自适应做实时转换后直接送入 LLM：

``` v-md-prism-python
def answer_from_html(file_url: str, user_question: str) -> str:
    # 1. 携带 Accept: text/markdown 下载，触发自动转换
    resp = requests.get(file_url, headers={"Accept": "text/markdown"})
    content_type = resp.headers.get("Content-Type", "")

    if content_type.startswith("text/markdown"):
        context = resp.text
    else:
        # 降级：自行处理 HTML 或提示用户
        context = extract_text_from_html(resp.text)

    # 2. 构造 Prompt，送入 LLM
    prompt = f"""基于以下文档内容回答问题：

{context}

问题：{user_question}
"""
    return llm.chat(prompt)
```

## **多格式文档统一接入**

企业知识库通常包含 Word、PDF、HTML 等多种格式，可通过 html2md 数据处理命令统一转换为 Markdown 后入库：

``` v-md-prism-
Word (.docx)  →  转 html  →  html2md  →  .md
HTML  (.html) →           →  html2md  →  .md
PDF   (.pdf)  →  转 html  →  html2md  →  .md
```

# **Markdown Token 预估参考**

| 原始 HTML 大小 | 预估 Markdown Token | 典型场景       |
|----------------|---------------------|----------------|
| ~16 KB         | ~3,000              | 一篇博客文章   |
| ~100 KB        | ~18,000             | 中型文档页面   |
| ~500 KB        | ~90,000             | 长篇技术文档   |
| 2 MB（上限）   | ~360,000            | 建议预处理分段 |

*注：以实际 Token 用量为准*

对于体积超过 100 KB 的 HTML 页面，建议在存入 Kodo 前做正文提取，进一步压缩无效内容。

# **对象存储 Kodo 支持 Markdown2HTML 形成双向链路**

| 使用方式 | 适用场景 |
|----|----|
| 调用 [MD转HTML](https://developer.qiniu.com/dora/1285/md-html-md2html) | Agent 生成 Markdown 后转网页展示 |
