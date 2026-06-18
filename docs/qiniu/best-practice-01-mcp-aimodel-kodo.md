---
title: 基于 MCP 使用大模型访问对象存储 Kodo
source: https://developer.qiniu.com/kodo/12914/mcp-aimodel-kodo
updated: 2025-09-30 14:42:43 +0800
fetched: 2026-06-18T15:34:04+00:00
category: best-practice
---

# 基于 MCP 使用大模型访问对象存储 Kodo

> 来源：[https://developer.qiniu.com/kodo/12914/mcp-aimodel-kodo](https://developer.qiniu.com/kodo/12914/mcp-aimodel-kodo)
> 原文更新时间：2025-09-30 14:42:43 +0800

> 本文档提供将七牛云存储（兼容S3协议）与 MCP（Model Context Protocol）服务集成的完整解决方案，基于AWS S3示例项目进行适配改造，适用于需要将对象存储内容接入大模型上下文的应用场景。

# **1 概述**

七牛云对象存储 Kodo 基于 S3 协议构建 Model Context Protocol (MCP) Server，支持用户在 AI 大模型客户端的上下文中通过该 MCP Server 来访问七牛云存储的空间和对象。

Model Context Protocol (MCP) 是一种专为大型语言模型（LLM）和 AI 系统设计的协议，旨在通过结构化上下文管理优化模型交互的效率和准确性，使 AI 模型能够安全地与本地和远程资源进行交互。

- [关于 MCP](https://modelcontextprotocol.io/introduction)
- MCP 的核心能力
  - 列举所有的资源、读取资源内容 [Resources](https://modelcontextprotocol.io/docs/concepts/resources)
  - 提供工具 [Tools](https://modelcontextprotocol.io/docs/concepts/tools)

基于 MCP，七牛云拓展集成 API 支持访问对象存储 Kodo，功能特性包括：

- 资源
  - 列举资源（受 AI 上下文限制，列举资源时默认只会列举 20 个资源，如果需要列举所有可使用工具分批次列举）
  - 读取资源
- 工具
  - 支持列举存储空间（Buckets）
  - 支持列举对象（Objects）
  - 支持读取对象内容
  - 支持上传本地文件，以及提供文件内容进行上传


# **2 环境要求**

- Python 3.12 或更高版本
- uv 包管理器

如果还没有安装 uv，可以使用以下命令安装：

``` v-md-prism-bash
# Mac（推荐使用 brew 安装）
brew install uv

# Linux & Mac
# 1. 安装
curl -LsSf https://astral.sh/uv/install.sh | sh
# 2. 安装完成后，请确保将软件包安装路径（包含 uv 和 uvx 可执行文件的目录）添加到系统的 PATH 环境变量中。
# 假设安装包路径为 /Users/xxx/.local/bin（见安装执行输出）
### 临时生效（当前会话），在当前终端中执行以下命令：
export PATH="/Users/xxx/.local/bin:$PATH"
### 永久生效（推荐），在当前终端中执行以下命令：
echo 'export PATH="/Users/xxx/.local/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile

# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

具体安装方式参考 [uv 安装](https://docs.astral.sh/uv/getting-started/installation/#pypi)

# **3 使用**

## **3.1 通过 MCP 的 inspector 验证 MCP Server**

1、需要提前配置 node 环境，本示例环境：node v22.4.0\
2、在终端中运行如下命令：

``` v-md-prism-
cd ${工程目录}
npx @modelcontextprotocol/inspector uvx qiniu-mcp-server
```

3、启动后，终端中会展示链接 URL，然后在浏览器中访问此 URL，通常是：http://localhost:5173\
4、在界面中点击 connect，connect 之后就可以列举资源了。


## **3.2 通过 Cline 验证 MCP Server**

通过 Cline 可以用与 AI 大模型聊天的方式来操作七牛云对象存储，接下来展示怎么通过 Cline 进行操作。\
下述演示是通过在 vscode 中下载 Cline 插件的方式进行的。\
1、首先下载 [vscode](https://code.visualstudio.com/)，在 vscode 中搜索 Cline 插件并安装\
2、安装成功后，需要在 Cline 配置大模型，可以按需指定并配置模型（如 deekseek OpenRounter 等）\
3、大模型配置完成之后，开始配置 MCP server，如下图\
配置信息参考：

``` v-md-prism-
{
  "mcpServers": {
    "qiniu": {
      "command": "uvx",
      "args": [
        "qiniu-mcp-server"
      ],
      "env": {
        "QINIU_ACCESS_KEY": "YOUR_QINIU_ACCESS_KEY",
        "QINIU_SECRET_KEY": "YOUR_QINIU_SECRET_KEY",
        "QINIU_REGION_NAME": "YOUR_QINIU_S3_REGION_NAME",
        "QINIU_ENDPOINT_URL": "YOUR_QINIU_S3_ENDPOINT_URL",
        "QINIU_BUCKETS": "YOUR_QINIU_BUCKETS"
      },
      "disabled": false
    }
  }
}

# 注：
# cursor 中创建 MCP Server 可直接使用上述配置。
# claude 中使用时可能会遇到：Error: spawn uvx ENOENT 错误，解决方案：command 中 参数填写 uvx 的绝对路径，eg: /usr/local/bin/uvx
```

参数说明：

``` v-md-prism-
# 下面信息均是必配项
# S3/Kodo 认证信息
QINIU_ACCESS_KEY: 七牛 Access Key
QINIU_SECRET_KEY: 七牛 Secret Key
# 区域信息，区域和 Endpint URL 在七牛 Bucket 管理信息界面可以查到，它们都是 Bucket s3 域名的一部分
# Bucket s3 域名样式：https://<Bucket>.s3.<Region>.qiniucs.com
QINIU_REGION_NAME: s3 区域名称，eg: cn-east-1 
QINIU_ENDPOINT_URL: EndpointURL # eg:https://s3.cn-east-1.qiniucs.com
QINIU_BUCKETS: 配置 Bucket，多个 Bucket 使用逗号隔开，所有 Bucket 在同一个区域，建议最多配置 20 个 Bucket
```

4、当前配置已完成，我们可以在聊天界面通过聊天方式操作七牛云对象存储了。下面给出一些示例：

- 请列举 qiniu 下以 xxx 为前缀的空间
- 请列举 qiniu 下 xxx 空间中以 yyy 为前缀的文件
- 继续列举示例：上次列举只列举了部分文件，请继续帮我列举剩下的文件
- 读取下 qiniu 下 xxx 空间中以 yyy 文件内容
