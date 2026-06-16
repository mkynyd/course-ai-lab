# MinerU API 概览

> 来源：https://mineru.net/apiManage/docs
> 上海人工智能实验室 (Shanghai AI Laboratory) 开发的高质量开源 PDF 文档解析工具

MinerU 提供两种文档解析 API，满足不同场景需求：

## API 对比

| 维度 | 🎯 Precision Extract API | ⚡ Agent Lightweight Extract API |
|---|---|---|
| **认证** | Bearer Token（API 管理页面自行创建） | 无（IP 限频） |
| **适用场景** | 生产环境、高精度解析 | AI Agent 工作流（如 OpenClaw） |
| **文件大小** | ≤ 200MB | ≤ 10MB |
| **页数限制** | ≤ 200 页 | ≤ 20 页 |
| **支持格式** | PDF、图片、Doc、Docx、Ppt、PPTx、Xls、Xlsx、HTML | PDF、图片、Docx、PPTx、Xlsx |
| **模型版本** | pipeline / vlm / MinerU-HTML | 固定 pipeline 轻量模型 |
| **表格/公式识别** | 支持（可配置） | 禁用 |
| **输出格式** | ZIP 包（MD + JSON + 可选 docx/html/latex） | 仅 MD（CDN 链接） |
| **批量处理** | 支持（≤ 50 文件/请求） | 不支持 |
| **回调通知** | 支持 | 不支持 |
| **每日额度** | 1000 页/天最高优先级 | IP 限频（超限返回 429） |
| **Base URL** | `https://mineru.net` | `https://mineru.net` |

## 认证方式

Precision API 需要在 HTTP Header 中携带 Token：

```
Authorization: Bearer <your_token>
```

Token 在 [MinerU API 管理页面](https://mineru.net/apiManage) 自行创建。

Agent API 无需认证。

## 支持的文件类型

| 类别 | 扩展名 | Precision API | Agent API |
|---|---|---|---|
| PDF | .pdf | ✅ | ✅ |
| 图片 | .png, .jpg, .jpeg, .jp2, .webp, .gif, .bmp | ✅ | ✅ |
| Word | .doc, .docx | ✅ | ✅ (仅 .docx) |
| PPT | .ppt, .pptx | ✅ | ✅ (仅 .pptx) |
| Excel | .xls, .xlsx | ✅ | ✅ (仅 .xlsx) |
| HTML | .html | ✅ | ❌ |

## 模型版本说明

| 模型 | 说明 | 适用文件 |
|---|---|---|
| `pipeline`（默认） | 标准管道模型 | 非 HTML 文件 |
| `vlm`（推荐） | 视觉语言模型，精度更高 | 非 HTML 文件 |
| `MinerU-HTML` | HTML 专用模型 | 仅 HTML 文件 |

## 语言代码

`language` 参数（默认 `ch`，仅适用于 pipeline/vlm 模型）：

### 独立语言包

| 代码 | 语言 |
|---|---|
| `ch` | 简体中文 + 英文（默认） |
| `ch_server` | CJK + 手写体 |
| `en` | 英文 |
| `japan` | 日文 |
| `korean` | 韩文 |
| `chinese_cht` | 繁体中文 |
| `ta` | 泰米尔语 |
| `te` | 泰卢固语 |
| `ka` | 卡纳达语 |
| `el` | 希腊语 |
| `th` | 泰语 |

### 语系包

| 代码 | 覆盖语言 |
|---|---|
| `latin` | 拉丁语系（50+ 欧洲语言）：法语、德语、意大利语、西班牙语、葡萄牙语、荷兰语、波兰语等 |
| `arabic` | 阿拉伯语系：阿拉伯语、波斯语、乌尔都语、普什图语等 |
| `cyrillic` | 西里尔语系：俄语、乌克兰语、保加利亚语、蒙古语等 |
| `east_slavic` | 东斯拉夫语系：俄语、白俄罗斯语、乌克兰语 |
| `devanagari` | 天城文语系：印地语、马拉地语、尼泊尔语、梵语等 |

## 解析结果文件说明

### 非 HTML 文件（ZIP 包内容）

| 文件 | 说明 |
|---|---|
| `full.md` | Markdown 解析结果 |
| `layout.json` | 中间处理结果（原 middle.json） |
| `*_model.json` | 模型推理结果（原 model.json） |
| `*_content_list.json` | 内容列表（原 content_list.json） |

### HTML 文件解析结果

| 文件 | 说明 |
|---|---|
| `full.md` | Markdown 解析结果 |
| `main.html` | 提取后的正文 HTML |

参考：https://opendatalab.github.io/MinerU/reference/output_files/

## 相关链接

- 官方网站：https://mineru.net
- GitHub：https://github.com/opendatalab/MinerU
- Issues：https://github.com/opendatalab/MinerU/issues
- Hugging Face：https://huggingface.co/opendatalab
- 在线体验：https://huggingface.co/spaces/opendatalab/MinerU
- 论文：https://arxiv.org/abs/2409.18839
- MinerU 2.5 论文：https://arxiv.org/abs/2509.22186
