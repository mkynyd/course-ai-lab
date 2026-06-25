#!/usr/bin/env python3
"""
LumenLab Promotional Image Generator v2
Generates 9 high-quality promotional images (3000x3000, 1:1, transparent background)
for the LumenLab AI learning platform targeting university students.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Output directory
OUTPUT_DIR = "/Users/yinjunhang/Documents/course-ai-lab/light-ai-chat/promo-images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Design System Colors
BG_TRANSPARENT = (0, 0, 0, 0)
DOT_GRID_COLOR = (229, 229, 234, 255)  # #e5e5ea
PRIMARY_TEXT = (26, 26, 30, 255)  # #1a1a1e
ACCENT_COLOR = (90, 95, 225, 255)  # #5a5fe1
SECONDARY_TEXT = (85, 85, 102, 255)  # #555566
SURFACE_WHITE = (255, 255, 255, 255)  # #ffffff
SHADOW_COLOR = (15, 23, 42, 25)
LIGHT_ACCENT = (90, 95, 225, 40)
LIGHT_ACCENT_BG = (232, 232, 249, 255)  # #e8e9f9
CHECK_GREEN = (52, 199, 89, 255)

# Image size
SIZE = 3000


def get_font(size, bold=False, index=0):
    """Try to load Chinese fonts with fallbacks."""
    font_paths = [
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "/Library/Fonts/SourceHanSerif.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                if bold:
                    return ImageFont.truetype(path, size, index=1)
                return ImageFont.truetype(path, size, index=index)
            except Exception:
                continue
    return ImageFont.load_default()


def create_base_canvas():
    """Create a transparent canvas with dot grid background."""
    img = Image.new("RGBA", (SIZE, SIZE), BG_TRANSPARENT)
    draw = ImageDraw.Draw(img)
    
    # Draw dot grid
    dot_spacing = 60
    dot_radius = 3
    for x in range(0, SIZE, dot_spacing):
        for y in range(0, SIZE, dot_spacing):
            draw.ellipse(
                [x - dot_radius, y - dot_radius, x + dot_radius, y + dot_radius],
                fill=DOT_GRID_COLOR
            )
    
    return img, draw


def draw_rounded_rect(draw, xy, radius, fill, shadow=True):
    """Draw a rounded rectangle with optional shadow."""
    x1, y1, x2, y2 = xy
    if shadow:
        shadow_offset = 16
        shadow_radius = radius + 6
        draw.rounded_rectangle(
            [x1 + shadow_offset, y1 + shadow_offset, x2 + shadow_offset, y2 + shadow_offset],
            radius=shadow_radius,
            fill=SHADOW_COLOR
        )
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def measure_text(draw, text, font):
    """Measure text width and height."""
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def draw_text_centered(draw, text, font, color, y, center_x=None):
    """Draw text centered horizontally."""
    if center_x is None:
        center_x = SIZE // 2
    text_width, text_height = measure_text(draw, text, font)
    x = center_x - text_width // 2
    draw.text((x, y), text, font=font, fill=color)
    return text_width, text_height


def draw_text_left(draw, text, font, color, x, y):
    """Draw text left-aligned."""
    draw.text((x, y), text, font=font, fill=color)
    return measure_text(draw, text, font)


# ====== 01 - BRAND ======
def generate_01_brand():
    img, draw = create_base_canvas()
    
    # Large geometric diamond logo
    center_x, center_y = SIZE // 2, 800
    diamond_size = 340
    points = [
        (center_x, center_y - diamond_size),
        (center_x + diamond_size * 0.9, center_y),
        (center_x, center_y + diamond_size * 0.6),
        (center_x - diamond_size * 0.9, center_y),
    ]
    draw.polygon(points, fill=ACCENT_COLOR)
    
    # Inner diamond accent
    inner_points = [
        (center_x, center_y - diamond_size * 0.5),
        (center_x + diamond_size * 0.4, center_y - diamond_size * 0.1),
        (center_x, center_y + diamond_size * 0.2),
        (center_x - diamond_size * 0.4, center_y - diamond_size * 0.1),
    ]
    draw.polygon(inner_points, fill=(255, 255, 255, 200))
    
    # Title background card
    title_font = get_font(170, bold=True)
    title_text = "LumenLab"
    tw, th = measure_text(draw, title_text, title_font)
    
    # Subtitle
    subtitle_font = get_font(68)
    sub_text = "面向大学生的AI学习工作台"
    sw, sh = measure_text(draw, sub_text, subtitle_font)
    
    # Title card
    card_pad_x = 80
    card_pad_y = 50
    card_w = max(tw, sw) + card_pad_x * 2
    card_h = th + sh + 40 + card_pad_y * 2
    card_x = (SIZE - card_w) // 2
    card_y = 1200
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    
    # Title text
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + card_pad_y)
    
    # Subtitle text
    draw_text_centered(draw, sub_text, subtitle_font, ACCENT_COLOR, card_y + card_pad_y + th + 35)
    
    # 3 feature cards at bottom
    card_width = 760
    card_height = 440
    card_y = 1900
    gap = 80
    start_x = (SIZE - (3 * card_width + 2 * gap)) // 2
    
    features = [
        ("项目式学习", "将知识转化为\n实践能力"),
        ("AI 对话", "自然语言交互\n即时获取解答"),
        ("PDF 解析", "一键上传\n智能解析与问答"),
    ]
    
    for i, (title, desc) in enumerate(features):
        x = start_x + i * (card_width + gap)
        draw_rounded_rect(draw, [x, card_y, x + card_width, card_y + card_height], 40, SURFACE_WHITE, shadow=True)
        
        # Icon circle
        icon_y = card_y + 70
        icon_radius = 52
        draw.ellipse([x + card_width//2 - icon_radius, icon_y - icon_radius, 
                      x + card_width//2 + icon_radius, icon_y + icon_radius], 
                     fill=LIGHT_ACCENT_BG)
        
        icon_color = ACCENT_COLOR
        if i == 0:
            # Project icon
            draw.rectangle([x + card_width//2 - 20, icon_y - 15, x + card_width//2 + 20, icon_y + 20], 
                          fill=icon_color)
            draw.rectangle([x + card_width//2 - 10, icon_y - 25, x + card_width//2 + 10, icon_y - 5], 
                          fill=icon_color)
        elif i == 1:
            # Chat bubble
            draw.rounded_rectangle([x + card_width//2 - 25, icon_y - 20, x + card_width//2 + 25, icon_y + 15], 
                                   radius=8, fill=icon_color)
            draw.polygon([(x + card_width//2 - 10, icon_y + 15), 
                         (x + card_width//2 - 20, icon_y + 30),
                         (x + card_width//2 + 5, icon_y + 15)], fill=icon_color)
        else:
            # PDF/doc icon
            draw.rectangle([x + card_width//2 - 18, icon_y - 25, x + card_width//2 + 18, icon_y + 20], 
                          fill=icon_color)
            draw.line([(x + card_width//2 - 8, icon_y - 10), (x + card_width//2 + 8, icon_y - 10)], 
                     fill=SURFACE_WHITE, width=3)
            draw.line([(x + card_width//2 - 8, icon_y + 2), (x + card_width//2 + 8, icon_y + 2)], 
                     fill=SURFACE_WHITE, width=3)
        
        # Card title
        card_title_font = get_font(56)
        title_y = card_y + 160
        draw_text_centered(draw, title, card_title_font, PRIMARY_TEXT, title_y, center_x=x + card_width//2)
        
        # Card description
        card_desc_font = get_font(42)
        lines = desc.split('\n')
        desc_y = card_y + 240
        for line in lines:
            lw, _ = measure_text(draw, line, card_desc_font)
            draw.text((x + (card_width - lw)//2, desc_y), line, font=card_desc_font, fill=SECONDARY_TEXT)
            desc_y += 55
    
    img.save(os.path.join(OUTPUT_DIR, "01-brand.png"))
    print("Generated: 01-brand.png")


# ====== 02 - PROJECT ======
def generate_02_project():
    img, draw = create_base_canvas()
    
    # Title card
    title_font = get_font(140, bold=True)
    title_text = "项目式学习"
    tw, th = measure_text(draw, title_text, title_font)
    
    subtitle_font = get_font(60)
    sub_text = "将知识转化为项目能力"
    sw, sh = measure_text(draw, sub_text, subtitle_font)
    
    card_w = max(tw, sw) + 120
    card_h = th + sh + 30 + 50
    card_x = (SIZE - card_w) // 2
    card_y = 200
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + 25)
    draw_text_centered(draw, sub_text, subtitle_font, SECONDARY_TEXT, card_y + 25 + th + 15)
    
    # 3 project cards
    card_width = 780
    card_height = 500
    card_y = 620
    gap = 60
    start_x = (SIZE - (3 * card_width + 2 * gap)) // 2
    
    projects = [
        ("智能编程", "AI 辅助代码生成\n与调试优化"),
        ("网站开发", "全栈项目实战\n从设计到部署"),
        ("数据可视化", "智能数据分析\n与图表生成"),
    ]
    
    for i, (title, desc) in enumerate(projects):
        x = start_x + i * (card_width + gap)
        draw_rounded_rect(draw, [x, card_y, x + card_width, card_y + card_height], 40, SURFACE_WHITE, shadow=True)
        
        # Top accent bar
        draw.rounded_rectangle([x + 40, card_y + 40, x + 120, card_y + 52], radius=6, fill=ACCENT_COLOR)
        
        # Title
        card_title_font = get_font(60)
        draw.text((x + 60, card_y + 90), title, font=card_title_font, fill=PRIMARY_TEXT)
        
        # Description
        card_desc_font = get_font(44)
        lines = desc.split('\n')
        desc_y = card_y + 190
        for line in lines:
            draw.text((x + 60, desc_y), line, font=card_desc_font, fill=SECONDARY_TEXT)
            desc_y += 60
        
        # Small illustration area
        ill_y = card_y + 360
        for j in range(5):
            color = ACCENT_COLOR if j < 3 else DOT_GRID_COLOR
            draw.ellipse([x + 60 + j * 50, ill_y, x + 80 + j * 50, ill_y + 20], fill=color)
    
    # Checklist items
    check_y = 1220
    check_font = get_font(52)
    checks = [
        "从项目需求出发，反向驱动学习",
        "AI 全程辅助，降低技术门槛",
        "输出可展示的完整项目成果",
    ]
    
    for check in checks:
        check_x = 420
        # Check circle
        draw.ellipse([check_x, check_y, check_x + 50, check_y + 50], fill=CHECK_GREEN)
        draw.polygon([(check_x + 12, check_y + 25), (check_x + 22, check_y + 35), (check_x + 38, check_y + 15)], 
                     fill=SURFACE_WHITE)
        
        draw.text((check_x + 80, check_y + 2), check, font=check_font, fill=PRIMARY_TEXT)
        check_y += 100
    
    # Large decorative illustration at bottom right
    deco_x, deco_y = 2200, 1700
    draw_rounded_rect(draw, [deco_x, deco_y, deco_x + 400, deco_y + 300], radius=30, fill=LIGHT_ACCENT_BG)
    draw_rounded_rect(draw, [deco_x, deco_y, deco_x + 160, deco_y + 60], radius=15, fill=LIGHT_ACCENT_BG)
    for j in range(3):
        fy = deco_y + 80 + j * 70
        draw.rounded_rectangle([deco_x + 40, fy, deco_x + 360, fy + 50], radius=10, fill=SURFACE_WHITE)
        draw.rectangle([deco_x + 60, fy + 18, deco_x + 200, fy + 32], fill=DOT_GRID_COLOR)
    
    img.save(os.path.join(OUTPUT_DIR, "02-project.png"))
    print("Generated: 02-project.png")


# ====== 03 - CHAT ======
def generate_03_chat():
    img, draw = create_base_canvas()
    
    # Title card
    title_font = get_font(140, bold=True)
    title_text = "AI 对话"
    tw, th = measure_text(draw, title_text, title_font)
    
    subtitle_font = get_font(60)
    sub_text = "自然语言交互，即时获取解答"
    sw, sh = measure_text(draw, sub_text, subtitle_font)
    
    card_w = max(tw, sw) + 120
    card_h = th + sh + 30 + 50
    card_x = (SIZE - card_w) // 2
    card_y = 200
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + 25)
    draw_text_centered(draw, sub_text, subtitle_font, SECONDARY_TEXT, card_y + 25 + th + 15)
    
    # User question bubble
    user_font = get_font(48)
    user_text = "帮我解释机器学习中的反向传播算法"
    uw, uh = measure_text(draw, user_text, user_font)
    
    bubble_pad = 40
    bubble_w = uw + bubble_pad * 2
    bubble_h = uh + bubble_pad * 2
    bubble_x = SIZE - bubble_w - 200
    bubble_y = 650
    
    # User avatar
    draw.ellipse([bubble_x - 100, bubble_y + 10, bubble_x - 20, bubble_y + 90], fill=ACCENT_COLOR)
    
    draw_rounded_rect(draw, [bubble_x, bubble_y, bubble_x + bubble_w, bubble_y + bubble_h], 30, (245, 245, 250, 255), shadow=True)
    draw.text((bubble_x + bubble_pad, bubble_y + bubble_pad), user_text, font=user_font, fill=PRIMARY_TEXT)
    
    # AI response bubble
    ai_font = get_font(44)
    ai_lines = [
        "反向传播（Backpropagation）是训练神经网络",
        "的核心算法。它通过计算损失函数对每个",
        "参数的梯度，从输出层向输入层逐层传播",
        "误差，并利用梯度下降更新权重。",
        "",
        "核心步骤：",
        "1. 前向传播计算预测输出",
        "2. 计算损失函数值",
        "3. 反向传播计算梯度",
    ]
    
    line_height = 60
    ai_bubble_h = len(ai_lines) * line_height + 80
    ai_bubble_w = 1400
    ai_bubble_x = 200
    ai_bubble_y = 950
    
    # AI avatar
    draw.ellipse([ai_bubble_x + ai_bubble_w + 20, ai_bubble_y + 10, 
                  ai_bubble_x + ai_bubble_w + 100, ai_bubble_y + 90], fill=ACCENT_COLOR)
    
    draw_rounded_rect(draw, [ai_bubble_x, ai_bubble_y, ai_bubble_x + ai_bubble_w, 
                              ai_bubble_y + ai_bubble_h], 30, SURFACE_WHITE, shadow=True)
    
    ai_y = ai_bubble_y + 40
    for line in ai_lines:
        draw.text((ai_bubble_x + 40, ai_y), line, font=ai_font, fill=PRIMARY_TEXT)
        ai_y += line_height
    
    # Floating sparkle elements
    sparkles = [(180, 800), (1700, 750), (1550, 1650), (250, 1700)]
    for sx, sy in sparkles:
        draw.ellipse([sx - 15, sy - 15, sx + 15, sy + 15], fill=ACCENT_COLOR)
        draw.ellipse([sx - 6, sy - 6, sx + 6, sy + 6], fill=SURFACE_WHITE)
    
    img.save(os.path.join(OUTPUT_DIR, "03-chat.png"))
    print("Generated: 03-chat.png")


# ====== 04 - PDF ======
def generate_04_pdf():
    img, draw = create_base_canvas()
    
    # Title card
    title_font = get_font(140, bold=True)
    title_text = "PDF 解析"
    tw, th = measure_text(draw, title_text, title_font)
    
    subtitle_font = get_font(60)
    sub_text = "一键上传，智能解析与问答"
    sw, sh = measure_text(draw, sub_text, subtitle_font)
    
    card_w = max(tw, sw) + 120
    card_h = th + sh + 30 + 50
    card_x = (SIZE - card_w) // 2
    card_y = 220
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + 25)
    draw_text_centered(draw, sub_text, subtitle_font, SECONDARY_TEXT, card_y + 25 + th + 15)
    
    # 2 PDF document cards
    doc_width = 620
    doc_height = 780
    doc_y = 700
    gap = 120
    start_x = (SIZE - (2 * doc_width + gap)) // 2
    
    docs = [
        ("物理学.pdf", "第 3 章 量子力学基础\n\n波函数与薛定谔方程\n..."),
        ("课程论文.pdf", "基于深度学习的图像分类\n\n摘要：本文提出..."),
    ]
    
    for i, (filename, content) in enumerate(docs):
        x = start_x + i * (doc_width + gap)
        draw_rounded_rect(draw, [x, doc_y, x + doc_width, doc_y + doc_height], 30, SURFACE_WHITE, shadow=True)
        
        # PDF header bar
        draw.rounded_rectangle([x, doc_y, x + doc_width, doc_y + 70], radius=30, fill=(250, 82, 82, 255))
        draw.rounded_rectangle([x, doc_y + 50, x + doc_width, doc_y + 70], radius=0, fill=(250, 82, 82, 255))
        
        # PDF icon
        draw.rectangle([x + 30, doc_y + 15, x + 55, doc_y + 50], fill=SURFACE_WHITE)
        draw.text((x + 65, doc_y + 18), "PDF", font=get_font(28), fill=SURFACE_WHITE)
        
        # Filename
        fname_font = get_font(48)
        draw.text((x + 40, doc_y + 100), filename, font=fname_font, fill=PRIMARY_TEXT)
        
        # Content lines
        content_font = get_font(36)
        lines = content.split('\n')
        cy = doc_y + 180
        for line in lines:
            if line:
                draw.text((x + 40, cy), line, font=content_font, fill=SECONDARY_TEXT)
            cy += 55
        
        # Page decoration
        for j in range(4):
            draw.rectangle([x + 40, doc_y + 450 + j * 35, x + doc_width - 80, doc_y + 470 + j * 35], 
                          fill=(240, 240, 245, 255))
    
    # Floating question icons
    questions = [
        "这篇论文的核心创新点是什么？",
        "请总结第三章的关键结论",
        "量子力学中的波函数如何理解？",
    ]
    q_font = get_font(40)
    q_y = 1650
    for q in questions:
        qw, qh = measure_text(draw, q, q_font)
        q_bubble_w = qw + 60
        q_bubble_h = qh + 30
        q_bubble_x = (SIZE - q_bubble_w) // 2 + (hash(q) % 400 - 200)
        
        draw_rounded_rect(draw, [q_bubble_x, q_y, q_bubble_x + q_bubble_w, q_y + q_bubble_h], 25, SURFACE_WHITE, shadow=True)
        draw.text((q_bubble_x + 30, q_y + 15), q, font=q_font, fill=ACCENT_COLOR)
        q_y += 120
    
    img.save(os.path.join(OUTPUT_DIR, "04-pdf.png"))
    print("Generated: 04-pdf.png")


# ====== 05 - AGENT ======
def generate_05_agent():
    img, draw = create_base_canvas()
    
    # Title card
    title_font = get_font(130, bold=True)
    title_text = "工具调用，可控可靠"
    tw, th = measure_text(draw, title_text, title_font)
    
    card_w = tw + 120
    card_h = th + 60
    card_x = (SIZE - card_w) // 2
    card_y = 250
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + 30)
    
    # 4 agent cards (2x2)
    card_width = 1200
    card_height = 520
    gap_x = 120
    gap_y = 100
    start_x = (SIZE - (2 * card_width + gap_x)) // 2
    start_y = 520
    
    agents = [
        ("L0", "自动执行", "AI 自动调用工具完成\n复杂任务流程", "无风险操作"),
        ("L1", "会话预审批", "关键操作前确认，\n确保每一步可控", "文件列表读取"),
        ("L2", "artifact 保存", "生成内容自动保存，\n便于后续使用", "需确认"),
        ("L3", "文件删除", "安全删除临时文件，\n保护数据隐私", "每次都需审批"),
    ]
    
    for i, (level, title, desc, detail) in enumerate(agents):
        row = i // 2
        col = i % 2
        x = start_x + col * (card_width + gap_x)
        y = start_y + row * (card_height + gap_y)
        
        draw_rounded_rect(draw, [x, y, x + card_width, y + card_height], 40, SURFACE_WHITE, shadow=True)
        
        # Level badge
        badge_font = get_font(40)
        draw.ellipse([x + 60, y + 50, x + 110, y + 100], fill=ACCENT_COLOR)
        draw.text((x + 68, y + 55), level, font=badge_font, fill=SURFACE_WHITE)
        
        # Title
        title_f = get_font(60)
        draw.text((x + 130, y + 50), title, font=title_f, fill=PRIMARY_TEXT)
        
        # Description
        desc_f = get_font(44)
        lines = desc.split('\n')
        dy = y + 140
        for line in lines:
            draw.text((x + 60, dy), line, font=desc_f, fill=SECONDARY_TEXT)
            dy += 60
        
        # Detail tag
        tag_y = y + card_height - 100
        draw.rounded_rectangle([x + 60, tag_y, x + 60 + 200, tag_y + 50], radius=25, fill=LIGHT_ACCENT_BG)
        tag_font = get_font(36)
        draw.text((x + 80, tag_y + 8), detail, font=tag_font, fill=ACCENT_COLOR)
    
    # Central lock icon
    lock_x, lock_y = SIZE // 2, 1750
    draw.ellipse([lock_x - 70, lock_y - 70, lock_x + 70, lock_y + 70], fill=LIGHT_ACCENT_BG)
    # Lock body
    draw.rounded_rectangle([lock_x - 30, lock_y - 10, lock_x + 30, lock_y + 40], radius=8, fill=ACCENT_COLOR)
    # Lock shackle
    draw.arc([lock_x - 25, lock_y - 45, lock_x + 25, lock_y + 5], 0, 180, fill=ACCENT_COLOR, width=6)
    
    # Security text
    sec_font = get_font(52)
    draw_text_centered(draw, "四层安全策略，让 AI 工具调用可控透明", sec_font, SECONDARY_TEXT, 1950)
    
    img.save(os.path.join(OUTPUT_DIR, "05-agent.png"))
    print("Generated: 05-agent.png")


# ====== 06 - PAPER ======
def generate_06_paper():
    img, draw = create_base_canvas()
    
    # Title card
    title_font = get_font(140, bold=True)
    title_text = "论文精读"
    tw, th = measure_text(draw, title_text, title_font)
    
    subtitle_font = get_font(60)
    sub_text = "AI 辅助论文解析与理解"
    sw, sh = measure_text(draw, sub_text, subtitle_font)
    
    card_w = max(tw, sw) + 120
    card_h = th + sh + 30 + 50
    card_x = (SIZE - card_w) // 2
    card_y = 220
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + 25)
    draw_text_centered(draw, sub_text, subtitle_font, SECONDARY_TEXT, card_y + 25 + th + 15)
    
    # 3 stages timeline
    stages = [
        ("上传论文", "支持 PDF 格式\n自动识别内容"),
        ("智能分块", "按章节拆分\n提取核心观点"),
        ("交互解析", "问答式深入\n逐段理解论文"),
    ]
    
    stage_y = 650
    stage_width = 700
    stage_height = 380
    gap = 80
    start_x = (SIZE - (3 * stage_width + 2 * gap)) // 2
    
    for i, (title, desc) in enumerate(stages):
        x = start_x + i * (stage_width + gap)
        draw_rounded_rect(draw, [x, stage_y, x + stage_width, stage_y + stage_height], 40, SURFACE_WHITE, shadow=True)
        
        # Stage number circle
        num_x = x + stage_width // 2
        num_y = stage_y + 60
        draw.ellipse([num_x - 45, num_y - 45, num_x + 45, num_y + 45], fill=ACCENT_COLOR)
        num_font = get_font(48)
        draw.text((num_x - 15, num_y - 20), str(i + 1), font=num_font, fill=SURFACE_WHITE)
        
        # Title
        title_f = get_font(56)
        draw_text_centered(draw, title, title_f, PRIMARY_TEXT, stage_y + 130, center_x=num_x)
        
        # Description
        desc_f = get_font(44)
        lines = desc.split('\n')
        dy = stage_y + 210
        for line in lines:
            lw, _ = measure_text(draw, line, desc_f)
            draw.text((x + (stage_width - lw)//2, dy), line, font=desc_f, fill=SECONDARY_TEXT)
            dy += 60
    
    # Timeline connector
    timeline_y = stage_y + 60
    draw.line([(start_x + stage_width, timeline_y), (start_x + stage_width + gap, timeline_y)], fill=ACCENT_COLOR, width=6)
    draw.line([(start_x + 2 * stage_width + gap, timeline_y), (start_x + 2 * stage_width + 2 * gap, timeline_y)], fill=ACCENT_COLOR, width=6)
    
    # Paper preview card at bottom
    paper_y = 1200
    paper_x = 350
    paper_w = 2300
    paper_h = 700
    
    draw_rounded_rect(draw, [paper_x, paper_y, paper_x + paper_w, paper_y + paper_h], 30, SURFACE_WHITE, shadow=True)
    
    # Paper content simulation
    paper_font = get_font(40)
    paper_lines = [
        "Abstract",
        "This paper presents a novel approach to...",
        "",
        "1. Introduction",
        "The rapid advancement of deep learning has...",
        "Our method achieves state-of-the-art results...",
        "",
        "2. Methodology",
        "We propose a hierarchical attention mechanism...",
    ]
    
    py = paper_y + 60
    for line in paper_lines:
        if line == "Abstract" or line.startswith(("1.", "2.")):
            draw.text((paper_x + 60, py), line, font=get_font(44, bold=True), fill=PRIMARY_TEXT)
        else:
            draw.text((paper_x + 60, py), line, font=paper_font, fill=SECONDARY_TEXT)
        py += 55
    
    # Highlight marker
    highlight_y = paper_y + 320
    draw.rounded_rectangle([paper_x + 50, highlight_y, paper_x + 800, highlight_y + 50], radius=8, fill=(255, 247, 200, 255))
    
    img.save(os.path.join(OUTPUT_DIR, "06-paper.png"))
    print("Generated: 06-paper.png")


# ====== 07 - EXAM ======
def generate_07_exam():
    img, draw = create_base_canvas()
    
    # Title card
    title_font = get_font(140, bold=True)
    title_text = "智能出题"
    tw, th = measure_text(draw, title_text, title_font)
    
    subtitle_font = get_font(60)
    sub_text = "AI 出题，基于项目文档，学习更高效"
    sw, sh = measure_text(draw, sub_text, subtitle_font)
    
    card_w = max(tw, sw) + 120
    card_h = th + sh + 30 + 50
    card_x = (SIZE - card_w) // 2
    card_y = 220
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + 25)
    draw_text_centered(draw, sub_text, subtitle_font, SECONDARY_TEXT, card_y + 25 + th + 15)
    
    # Question card 1 - Multiple choice
    q1_x, q1_y = 200, 650
    q1_w, q1_h = 1250, 700
    
    draw_rounded_rect(draw, [q1_x, q1_y, q1_x + q1_w, q1_y + q1_h], 40, SURFACE_WHITE, shadow=True)
    
    # Question header
    draw.rounded_rectangle([q1_x, q1_y, q1_x + 200, q1_y + 60], radius=30, fill=ACCENT_COLOR)
    draw.text((q1_x + 40, q1_y + 10), "选择题", font=get_font(36), fill=SURFACE_WHITE)
    
    q_font = get_font(44)
    draw.text((q1_x + 40, q1_y + 100), "以下哪个算法常用于图像分类任务？", font=q_font, fill=PRIMARY_TEXT)
    
    options = [
        ("A", "K-means 聚类"),
        ("B", "卷积神经网络 (CNN)"),
        ("C", "线性回归"),
        ("D", "决策树"),
    ]
    
    opt_y = q1_y + 200
    for opt, text in options:
        # Radio circle
        draw.ellipse([q1_x + 60, opt_y, q1_x + 100, opt_y + 40], outline=SECONDARY_TEXT, width=3)
        if opt == "B":
            draw.ellipse([q1_x + 68, opt_y + 8, q1_x + 92, opt_y + 32], fill=ACCENT_COLOR)
        draw.text((q1_x + 120, opt_y - 2), f"{opt}. {text}", font=get_font(42), fill=PRIMARY_TEXT)
        opt_y += 90
    
    # Question card 2 - Essay
    q2_x, q2_y = 1550, 650
    q2_w, q2_h = 1250, 700
    
    draw_rounded_rect(draw, [q2_x, q2_y, q2_x + q2_w, q2_y + q2_h], 40, SURFACE_WHITE, shadow=True)
    
    draw.rounded_rectangle([q2_x, q2_y, q2_x + 200, q2_y + 60], radius=30, fill=ACCENT_COLOR)
    draw.text((q2_x + 40, q2_y + 10), "问答题", font=get_font(36), fill=SURFACE_WHITE)
    
    draw.text((q2_x + 40, q2_y + 100), "请简述反向传播算法的基本原理，", font=q_font, fill=PRIMARY_TEXT)
    draw.text((q2_x + 40, q2_y + 170), "并说明其在深度学习中的作用。", font=q_font, fill=PRIMARY_TEXT)
    
    draw.text((q2_x + 40, q2_y + 300), "AI 将基于项目文档自动评分...", font=get_font(40), fill=SECONDARY_TEXT)
    
    # Notebook illustration
    nb_x, nb_y = 200, 1500
    nb_w, nb_h = 800, 900
    
    draw_rounded_rect(draw, [nb_x, nb_y, nb_x + nb_w, nb_y + nb_h], 30, SURFACE_WHITE, shadow=True)
    
    # Notebook header
    draw.rounded_rectangle([nb_x, nb_y, nb_x + nb_w, nb_y + 80], radius=30, fill=ACCENT_COLOR)
    draw.rounded_rectangle([nb_x, nb_y + 50, nb_x + nb_w, nb_y + 80], radius=0, fill=ACCENT_COLOR)
    
    # Notebook lines
    line_font = get_font(40)
    lines = [
        "1. 数据预处理步骤",
        "2. 模型架构选择",
        "3. 训练参数设置",
        "4. 评估指标分析",
        "5. 结果可视化",
    ]
    ly = nb_y + 120
    for line in lines:
        draw.text((nb_x + 40, ly), line, font=line_font, fill=PRIMARY_TEXT)
        draw.line([(nb_x + 40, ly + 50), (nb_x + nb_w - 40, ly + 50)], fill=DOT_GRID_COLOR, width=2)
        ly += 100
    
    # Score indicator
    score_x, score_y = 1600, 1550
    draw.ellipse([score_x, score_y, score_x + 200, score_y + 200], fill=LIGHT_ACCENT_BG)
    score_font = get_font(80, bold=True)
    draw.text((score_x + 45, score_y + 50), "92", font=score_font, fill=ACCENT_COLOR)
    draw.text((score_x + 35, score_y + 220), "AI 评分", font=get_font(44), fill=SECONDARY_TEXT)
    
    img.save(os.path.join(OUTPUT_DIR, "07-exam.png"))
    print("Generated: 07-exam.png")


# ====== 08 - SOCRATIC ======
def generate_08_socratic():
    img, draw = create_base_canvas()
    
    # Title card
    title_font = get_font(120, bold=True)
    title_text = "苏格拉底式对话"
    tw, th = measure_text(draw, title_text, title_font)
    
    subtitle_font = get_font(56)
    sub_text = "引导式思考，深入理解"
    sw, sh = measure_text(draw, sub_text, subtitle_font)
    
    card_w = max(tw, sw) + 120
    card_h = th + sh + 30 + 50
    card_x = (SIZE - card_w) // 2
    card_y = 220
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + 25)
    draw_text_centered(draw, sub_text, subtitle_font, SECONDARY_TEXT, card_y + 25 + th + 15)
    
    # Socratic dialogue bubbles
    dialogues = [
        ("为什么你觉得这个结论是显然的？", True, 600),
        ("让我们从另一个角度思考...", False, 850),
        ("这个假设在什么条件下不成立？", True, 1100),
        ("很好的观察。那么，如果我们将...", False, 1350),
    ]
    
    for text, is_question, y in dialogues:
        font = get_font(48)
        tw, th = measure_text(draw, text, font)
        
        pad_x = 50
        pad_y = 35
        bw = tw + pad_x * 2
        bh = th + pad_y * 2
        
        if is_question:
            bx = SIZE - bw - 250
            # Question mark icon
            draw.ellipse([bx - 80, y + 10, bx - 10, y + 80], fill=(255, 200, 100, 255))
            color = (255, 250, 240, 255)
        else:
            bx = 250
            # Lightbulb icon
            draw.ellipse([bx + bw + 10, y + 10, bx + bw + 80, y + 80], fill=ACCENT_COLOR)
            color = SURFACE_WHITE
        
        draw_rounded_rect(draw, [bx, y, bx + bw, y + bh], 25, color, shadow=True)
        draw.text((bx + pad_x, y + pad_y), text, font=font, fill=PRIMARY_TEXT)
    
    # Decorative lightbulb
    bulb_x, bulb_y = SIZE // 2, 1850
    draw.ellipse([bulb_x - 80, bulb_y - 80, bulb_x + 80, bulb_y + 80], fill=(255, 220, 100, 255))
    # Bulb rays
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        x1 = bulb_x + math.cos(rad) * 90
        y1 = bulb_y + math.sin(rad) * 90
        x2 = bulb_x + math.cos(rad) * 130
        y2 = bulb_y + math.sin(rad) * 130
        draw.line([(x1, y1), (x2, y2)], fill=(255, 200, 80, 255), width=8)
    
    # Bottom text
    bottom_font = get_font(52)
    draw_text_centered(draw, "通过层层追问，培养批判性思维", bottom_font, SECONDARY_TEXT, 2100)
    
    img.save(os.path.join(OUTPUT_DIR, "08-socratic.png"))
    print("Generated: 08-socratic.png")


# ====== 09 - RAG ======
def generate_09_rag():
    img, draw = create_base_canvas()
    
    # Title card
    title_font = get_font(130, bold=True)
    title_text = "上下文联结，精准回答"
    tw, th = measure_text(draw, title_text, title_font)
    
    card_w = tw + 120
    card_h = th + 60
    card_x = (SIZE - card_w) // 2
    card_y = 250
    
    draw_rounded_rect(draw, [card_x, card_y, card_x + card_w, card_y + card_h], 50, SURFACE_WHITE, shadow=True)
    draw_text_centered(draw, title_text, title_font, PRIMARY_TEXT, card_y + 30)
    
    # RAG network diagram
    nodes = [
        ("检索", 700, 850),
        ("整合", 1500, 700),
        ("生成", 2300, 850),
    ]
    
    # Draw connections
    draw.line([(700, 850), (1500, 700)], fill=ACCENT_COLOR, width=6)
    draw.line([(1500, 700), (2300, 850)], fill=ACCENT_COLOR, width=6)
    
    # Draw nodes
    for label, nx, ny in nodes:
        # Node circle
        draw.ellipse([nx - 100, ny - 100, nx + 100, ny + 100], fill=SURFACE_WHITE, outline=ACCENT_COLOR, width=6)
        # Inner accent
        draw.ellipse([nx - 70, ny - 70, nx + 70, ny + 70], fill=LIGHT_ACCENT_BG)
        # Label
        label_font = get_font(56)
        lw, lh = measure_text(draw, label, label_font)
        draw.text((nx - lw//2, ny - lh//2), label, font=label_font, fill=PRIMARY_TEXT)
    
    # Data source icons below retrieve
    sources = [
        ("文档库", 400, 1150),
        ("知识库", 700, 1150),
        ("数据库", 1000, 1150),
    ]
    
    for label, sx, sy in sources:
        draw.rounded_rectangle([sx - 100, sy - 40, sx + 100, sy + 40], radius=20, fill=SURFACE_WHITE)
        draw.text((sx - 60, sy - 20), label, font=get_font(40), fill=SECONDARY_TEXT)
        # Connection to retrieve node
        draw.line([(sx, sy - 40), (700, 950)], fill=DOT_GRID_COLOR, width=4)
    
    # Output result
    result_x, result_y = 2300, 1150
    draw_rounded_rect(draw, [result_x - 150, result_y - 60, result_x + 150, result_y + 60], 30, SURFACE_WHITE, shadow=True)
    draw.text((result_x - 80, result_y - 25), "精准回答", font=get_font(44), fill=ACCENT_COLOR)
    draw.line([(2300, 950), (result_x, result_y - 60)], fill=ACCENT_COLOR, width=4)
    
    # 3 search tags at bottom
    tags = [
        ("关键词检索", 0),
        ("向量检索", 1),
        ("混合检索", 2),
    ]
    
    tag_y = 1500
    tag_font = get_font(48)
    tag_w = 320
    tag_h = 90
    gap = 80
    start_x = (SIZE - (3 * tag_w + 2 * gap)) // 2
    
    for i, (tag, _) in enumerate(tags):
        x = start_x + i * (tag_w + gap)
        draw_rounded_rect(draw, [x, tag_y, x + tag_w, tag_y + tag_h], 45, SURFACE_WHITE, shadow=True)
        # Small icon
        draw.ellipse([x + 30, tag_y + 25, x + 60, tag_y + 55], fill=ACCENT_COLOR)
        tw, _ = measure_text(draw, tag, tag_font)
        draw.text((x + (tag_w - tw)//2 + 15, tag_y + 20), tag, font=tag_font, fill=PRIMARY_TEXT)
    
    # RAG explanation text
    explain_font = get_font(44)
    explain_text = "RAG = 检索增强生成，结合外部知识与大模型理解能力"
    draw_text_centered(draw, explain_text, explain_font, SECONDARY_TEXT, 1750)
    
    img.save(os.path.join(OUTPUT_DIR, "09-rag.png"))
    print("Generated: 09-rag.png")


# ====== MAIN ======
if __name__ == "__main__":
    generate_01_brand()
    generate_02_project()
    generate_03_chat()
    generate_04_pdf()
    generate_05_agent()
    generate_06_paper()
    generate_07_exam()
    generate_08_socratic()
    generate_09_rag()
    print("\nAll 9 promotional images generated successfully!")
