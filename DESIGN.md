# Design

## Motion

应用内部动效遵循克制动效原则：只用于解释状态变化，尊重 `prefers-reduced-motion`。

## Landing Page Exception

Landing 页是品牌第一印象与功能预览场景，允许使用装饰性滚动揭示、文字轮播等氛围动效，但仍需响应 `prefers-reduced-motion`，并保证核心 CTA 与导航清晰可点击。
