# 任务路由

> LumenLab 当前使用项目类型（`experiment` / `review` / `coding` / `general`）决定系统提示词模板。本章说明当前实现与设计预留。

## 本章内容

- [当前机制](#当前机制)
- [关键词任务识别模块](#关键词任务识别模块)
- [项目类型与提示词](#项目类型与提示词)
- [快捷任务](#快捷任务)
- [扩展点](#扩展点)

## 当前机制

生产聊天路径（`src/app/api/chat/route.ts`）不调用任务路由器。它按以下优先级确定 `mode`：

1. 请求体中的 `mode` 字段。
2. 项目配置中的 `Project.type`。
3. 兜底为 `general`。

`mode` 随后传给 `assembleSystemPrompt`（`src/lib/classification.ts`），拼接全局提示、用户画像、项目系统提示和模式提示。

## 关键词任务识别模块

`src/lib/ai/task-router.ts` 提供了一个零 token 的关键词任务识别函数 `routeTask`，但**当前未接入聊天主路径**。它可以返回：

- `mode`：推断的项目类型。
- `taskTypes`：中文任务标签列表，如 `"实验/实践报告生成"`、`"数据处理计算"`、`"资料总结"`、`"代码调试"` 等。
- `domain`：学科领域（如 "电路与电子技术"、"操作系统"）。
- `needsFiles` / `missingInfo`：是否建议上传文件。

实现方式：对三组关键词数组（实验、复习、编程）做简单的子串匹配计数，无权重机制。

## 项目类型与提示词

提示词模板位于 `src/lib/ai/prompts.ts`，按 `mode` 分为四类：

| mode | 用途 |
|------|------|
| `experiment` | 实验报告、数据处理、误差分析 |
| `review` | 复习提纲、试卷分析、错题解析 |
| `coding` | 代码解释、调试、复杂度分析 |
| `general` | 通用问答 |

## 快捷任务

项目聊天输入框上方渲染快捷任务按钮条（`QuickTaskBar`），每个按钮对应一个预定义 prompt。点击后把 prompt 作为 `hiddenPrompt` 发送，不会经过 `/task` 命令解析。

预定义任务在 `src/lib/quick-actions.ts` 中按项目类型配置。

## 扩展点

如需接入 `routeTask`，可在 `src/app/api/chat/route.ts` 组装系统提示前调用它，并将其 `mode` / `taskTypes` 注入 prompt 上下文。当前没有 `/task <id>` 强制指定机制。
