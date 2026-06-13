# 成果库与导出

## 设计目标

项目聊天中的 AI 回复可以由用户手动保存为 Artifact。系统不会自动保存每条回复，也不会为复习提纲、模拟题、实验报告等分别建立数据表，而是通过 `Artifact.type` 区分成果用途。

## 唯一内容源

`Artifact.content` 始终保存原始 Markdown。Markdown 是唯一事实来源，DOCX 和 PDF 仅在下载请求发生时即时生成，不写回数据库，也不修改原文。

## 导出格式

- Markdown：直接以 UTF-8 `.md` 文件下载。
- Word：使用 `docx` 从 Markdown AST 生成 `.docx`，支持标题、段落、粗体、斜体、代码块、列表、表格、引用和分隔线。
- PDF：使用 `pdfkit` 与 Noto Sans SC 中文字体生成 `.pdf`，不依赖 Chromium。

导出接口：

```text
GET /api/artifacts/{id}/export?format=markdown
GET /api/artifacts/{id}/export?format=docx
GET /api/artifacts/{id}/export?format=pdf
```

所有接口都校验登录状态和 Artifact 的 `userId`。下载文件名会清理路径字符、换行和响应头危险字符。

## 当前限制

- Mermaid 首版保留为带“Mermaid 源码”提示的代码块，不渲染为图片。
- LaTeX 首版保留原始文本，不转换为 Word 公式对象或 PDF 数学排版。
- PDF 表格采用轻量文本布局，复杂合并单元格不会完全还原。
- 首版不记录导出历史，也不缓存生成文件。

## 部署要求

PDF 导出使用 Node.js runtime，并需要 `pdfkit` 和随应用安装的 Noto Sans SC 字体。PDF 资料解析使用 `pdfjs-dist` 与 `@napi-rs/canvas`，扫描型 PDF 最多同步处理前 10 页。

后续可以扩展学校模板封面、实验报告固定格式、导出历史、Mermaid 图片渲染和 LaTeX 公式对象。
