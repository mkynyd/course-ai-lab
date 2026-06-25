#!/usr/bin/env python3
"""
LumenLab Promotional Image Generator
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
SHADOW_COLOR = (0, 0, 0, 30)
LIGHT_ACCENT = (90, 95, 225, 40)
LIGHT_ACCENT_BG = (245, 245, 255, 255)
CHECK_GREEN = (52, 199, 89, 255)

# Image size
SIZE = 3000


def get_font(size, bold=False):
    """Try to load Chinese fonts with fallbacks."""
    font_paths = [
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/Library/Fonts/SourceHanSerif.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=0 if bold else 0)
            except Exception:
                continue
    return ImageFont.load_default()


def get_font_index(size, index=0):
    """Load font by index for ttc files."""
    font_paths = [
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/Library/Fonts/SourceHanSerif.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
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
        # Draw shadow
        shadow_offset = 12
        shadow_radius = radius + 4
        draw.rounded_rectangle(
            [x1 + shadow_offset, y1 + shadow_offset, x2 + shadow_offset, y2 + shadow_offset],
            radius=shadow_radius,
            fill=SHADOW_COLOR
        )
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def draw_text_centered(draw, text, font, color, y, center_x=None):
    """Draw text centered horizontally."""
    if center_x is None:
        center_x = SIZE // 2
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    x = center_x - text_width // 2
    draw.text((x, y), text, font=font, fill=color)
    return y + (bbox[3] - bbox[1])


def draw_text_left(draw, text, font, color, x, y):
    """Draw text left-aligned."""
    draw.text((x, y), text, font=font, fill=color)
    bbox = draw.textbbox((x, y), text, font=font)
    return bbox[3] - bbox[1]


# ====== 01 - BRAND ======
def generate_01_brand():
    img, draw = create_base_canvas()
    
    # Large geometric diamond logo
    center_x, center_y = SIZE // 2, 900
    diamond_size = 320
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
    draw.polygon(inner_points, fill=(255, 255, 255, 180))
    
    # Title: LumenLab
    title_font = get_font_index(180, 0)
    y = 1300
    draw_text_centered(draw, "LumenLab", title_font, PRIMARY_TEXT, y)
    
    # Subtitle
    subtitle_font = get_font_index(72, 0)
    y = 1550
    draw_text_centered(draw, "面向大学生的AI学习工作台", subtitle_font, SECONDARY_TEXT, y)
    
    # 3 feature cards at bottom
    card_width = 760
    card_height = 420
    card_y = 2000
    gap = 80
    start_x = (SIZE - (3 * card_width + 2 * gap)) // 2
    
    features = [
        ("项目式学习", "将知识转化为\n实践能力"),
        ("AI对话", "自然语言交互\n即时获取解答"),
        ("PDF解析", "一键上传\n智能解析与问答"),
    ]
    
    for i, (title, desc) in enumerate(features):
        x = start_x + i * (card_width + gap)
        draw_rounded_rect(draw, [x, card_y, x + card_width, card_y + card_height], 40, SURFACE_WHITE, shadow=True)
        
        # Icon circle
        icon_y = card_y + 70
        icon_radius = 50
        draw.ellipse([x + card_width//2 - icon_radius, icon_y - icon_radius, 
                      x + card_width//2 + icon_radius, icon_y + icon_radius], 
                     fill=LIGHT_ACCENT_BG)
        
        # Simple icon shape
        icon_color = ACCENT_COLOR
        # Draw a small geometric shape inside circle
        if i == 0:
            # Book/project icon
            draw.rectangle([x + card_width//2 - 20, icon_y - 15, x + card_width//2 + 20, icon_y + 20], 
                          fill=icon_color, outline=icon_color)
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
        card_title_font = get_font_index(56, 0)
        title_y = card_y + 160
        draw_text_centered(draw, title, card_title_font, PRIMARY_TEXT, title_y, center_x=x + card_width//2)
        
        # Card description
        card_desc_font = get_font_index(44, 0)
        lines = desc.split('\n')
        desc_y = card_y + 240
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=card_desc_font)
            text_w = bbox[2] - bbox[0]
            draw.text((x + (card_width - text_w)//2, desc_y), line, font=card_desc_font, fill=SECONDARY_TEXT)
            desc_y += 55
    
    img.save(os.path.join(OUTPUT_DIR, "01-brand.png"))
    print("Generated: 01-brand.png")


# ====== 02 - PROJECT ======
def generate_02_project():
    img, draw = create_base_canvas()
    
    # Title
    title_font = get_font_index(140, 0)
    y = 220
    draw_text_centered(draw, "项目式学习", title_font, PRIMARY_TEXT, y)
    
    subtitle_font = get_font_index(64, 0)
    y = 420
    draw_text_centered(draw, "将知识转化为项目能力", subtitle_font, SECONDARY_TEXT, y)
    
    # 3 project cards
    card_width = 800
    card_height = 480
    card_y = 650
    gap = 60
    start_x = (SIZE - (3 * card_width + 2 * gap)) // 2
    
    projects = [
        ("智能编程", "AI辅助代码生成\n与调试优化"),
        ("网站开发", "全栈项目实战\n从设计到部署"),
        ("数据可视化", "智能数据分析\n与图表生成"),
    ]
    
    for i, (title, desc) in enumerate(projects):
        x = start_x + i * (card_width + gap)
        draw_rounded_rect(draw, [x, card_y, x + card_width, card_y + card_height], 40, SURFACE_WHITE, shadow=True)
        
        # Top accent bar
        draw.rounded_rectangle([x + 40, card_y + 40, x + 120, card_y + 50], radius=5, fill=ACCENT_COLOR)
        
        # Title
        card_title_font = get_font_index(60, 0)
        draw.text((x + 60, card_y + 90), title, font=card_title_font, fill=PRIMARY_TEXT)
        
        # Description
        card_desc_font = get_font_index(44, 0)
        lines = desc.split('\n')
        desc_y = card_y + 190
        for line in lines:
            draw.text((x + 60, desc_y), line, font=card_desc_font, fill=SECONDARY_TEXT)
            desc_y += 60
        
        # Small illustration area
        ill_y = card_y + 340
        # Simple code-like dots
        for j in range(5):
            color = ACCENT_COLOR if j < 3 else DOT_GRID_COLOR
            draw.ellipse([x + 60 + j * 50, ill_y, x + 80 + j * 50, ill_y + 20], fill=color)
    
    # Checklist items at bottom
    check_y = 1300
    check_font = get_font_index(52, 0)
    checks = [
        "从项目需求出发，反向驱动学习",
        "AI 全程辅助，降低技术门槛",
        "输出可展示的完整项目成果",
    ]
    
    for check in checks:
        # Check circle
        check_x = 400
        draw.ellipse([check_x, check_y, check_x + 50, check_y + 50], fill=CHECK_GREEN)
        draw.polygon([(check_x + 12, check_y + 25), (check_x + 22, check_y + 35), (check_x + 38, check_y + 15)], 
                     fill=SURFACE_WHITE)
        
        draw.text((check_x + 80, check_y + 2), check, font=check_font, fill=PRIMARY_TEXT)
        check_y += 100
    
    # Large decorative illustration at bottom right
    deco_x, deco_y = 2200, 1800
    # Folder icon
    draw.rounded_rectangle([deco_x, deco_y, deco_x + 400, deco_y + 300], radius=30, fill=LIGHT_ACCENT_BG)
    draw.rounded_rectangle([deco_x, deco_y, deco_x + 160, deco_y + 60], radius=15, fill=LIGHT_ACCENT_BG)
    # Files inside
    for j in range(3):
        fy = deco_y + 80 + j * 70
        draw.rounded_rectangle([deco_x + 40, fy, deco_x + 360, fy + 50], radius=10, fill=SURFACE_WHITE)
        draw.rectangle([deco_x + 60, fy + 18, deco_x + 200, fy + 32], fill=DOT_GRID_COLOR)
    
    img.save(os.path.join(OUTPUT_DIR, "02-project.png"))
    print("Generated: 02-project.png")


# ====== 03 - CHAT ======
def generate_03_chat():
    img, draw = create_base_canvas()
    
    # Title
    title_font = get_font_index(140, 0)
    y = 220
    draw_text_centered(draw, "AI对话", title_font, PRIMARY_TEXT, y)
    
    subtitle_font = get_font_index(64, 0)
    y = 420
    draw_text_centered(draw, "自然语言交互，即时获取解答", subtitle_font, SECONDARY_TEXT, y)
    
    # Chat bubbles
    bubble_width = 1400
    bubble_radius = 50
    
    # User bubble (right-aligned)
    user_bubble_y = 650
    user_bubble_x = SIZE - bubble_width - 250
    draw_rounded_rect(draw, [user_bubble_x, user_bubble_y, user_bubble_x + bubble_width, user_bubble_y + 200], 
                      bubble_radius, (240, 240, 245, 255), shadow=True)
    
    user_font = get_font_index(52, 0)
    draw.text((user_bubble_x + 50, user_bubble_y + 65), "帮我解释机器学习中的反向传播算法", 
              font=user_font, fill=PRIMARY_TEXT)
    
    # User avatar
    avatar_x = user_bubble_x + bubble_width + 40
    avatar_y = user_bubble_y + 50
    draw.ellipse([avatar_x, avatar_y, avatar_x + 100, avatar_y + 100], fill=DOT_GRID_COLOR)
    draw.text((avatar_x + 25, avatar_y + 20), "我", font=get_font_index(48, 0), fill=SECONDARY_TEXT)
    
    # AI bubble (left-aligned, accent color)
    ai_bubble_y = 920
    ai_bubble_x = 250
    draw_rounded_rect(draw, [ai_bubble_x, ai_bubble_y, ai_bubble_x + bubble_width + 200, ai_bubble_y + 520], 
                      bubble_radius, SURFACE_WHITE, shadow=True)
    
    # AI avatar
    ai_avatar_x = ai_bubble_x - 140
    ai_avatar_y = ai_bubble_y + 50
    draw.ellipse([ai_avatar_x, ai_avatar_y, ai_avatar_x + 100, ai_avatar_y + 100], fill=ACCENT_COLOR)
    draw.text((ai_avatar_x + 18, ai_avatar_y + 22), "AI", font=get_font_index(40, 0), fill=SURFACE_WHITE)
    
    ai_font = get_font_index(48, 0)
    ai_text = [
        "反向传播（Backpropagation）是训练神经网络",
        "的核心算法。它通过计算损失函数对每个",
        "参数的梯度，从输出层向输入层逐层传播",
        "误差，并利用梯度下降更新权重。",
        "",
        "核心步骤：",
        "1. 前向传播计算预测输出",
        "2. 计算损失函数值",
        "3. 反向传播计算梯度",
        "4. 更新网络参数",
    ]
    text_y = ai_bubble_y + 50
    for line in ai_text:
        draw.text((ai_bubble_x + 50, text_y), line, font=ai_font, fill=PRIMARY_TEXT)
        text_y += 55
    
    # Decorative elements at bottom
    # Small chat indicators
    deco_y = 1700
    for i in range(3):
        dx = 400 + i * 200
        draw.ellipse([dx, deco_y, dx + 30, deco_y + 30], fill=LIGHT_ACCENT if i == 2 else DOT_GRID_COLOR)
    
    # Sparkle icons
    sparkle_x, sparkle_y = 2200, 1600
    for _ in range(4):
        draw.polygon([(sparkle_x, sparkle_y - 30), (sparkle_x + 10, sparkle_y), 
                      (sparkle_x, sparkle_y + 30), (sparkle_x - 10, sparkle_y)], fill=ACCENT_COLOR)
        sparkle_x += 120
        sparkle_y += 80
    
    img.save(os.path.join(OUTPUT_DIR, "03-chat.png"))
    print("Generated: 03-chat.png")


# ====== 04 - PDF ======
def generate_04_pdf():
    img, draw = create_base_canvas()
    
    # Title
    title_font = get_font_index(140, 0)
    y = 220
    draw_text_centered(draw, "PDF解析", title_font, PRIMARY_TEXT, y)
    
    subtitle_font = get_font_index(64, 0)
    y = 420
    draw_text_centered(draw, "一键上传，智能解析与问答", subtitle_font, SECONDARY_TEXT, y)
    
    # 2 document cards
    doc_width = 1100
    doc_height = 700
    doc_y = 600
    gap = 120
    start_x = (SIZE - (2 * doc_width + gap)) // 2
    
    docs = [
        ("物理学.pdf", "128 页 · 量子力学基础"),
        ("课程论文.pdf", "45 页 · 深度学习综述"),
    ]
    
    for i, (name, info) in enumerate(docs):
        x = start_x + i * (doc_width + gap)
        draw_rounded_rect(draw, [x, doc_y, x + doc_width, doc_y + doc_height], 40, SURFACE_WHITE, shadow=True)
        
        # PDF icon (red document)
        icon_x = x + 60
        icon_y = doc_y + 60
        draw.rounded_rectangle([icon_x, icon_y, icon_x + 100, icon_y + 130], radius=10, fill=(255, 90, 90, 255))
        draw.text((icon_x + 15, icon_y + 40), "PDF", font=get_font_index(36, 0), fill=SURFACE_WHITE)
        
        # Filename
        name_font = get_font_index(56, 0)
        draw.text((icon_x + 130, icon_y + 30), name, font=name_font, fill=PRIMARY_TEXT)
        
        # Info
        info_font = get_font_index(44, 0)
        draw.text((icon_x + 130, icon_y + 100), info, font=info_font, fill=SECONDARY_TEXT)
        
        # Content lines (simulated text)
        line_y = doc_y + 240
        line_color = (220, 220, 230, 255)
        for j in range(6):
            line_width = 800 - (j % 3) * 100
            draw.rounded_rectangle([x + 60, line_y, x + 60 + line_width, line_y + 20], 
                                   radius=10, fill=line_color)
            line_y += 50
        
        # Bottom status
        status_y = doc_y + doc_height - 80
        draw.rounded_rectangle([x + 60, status_y, x + 300, status_y + 50], radius=25, fill=LIGHT_ACCENT_BG)
        draw.text((x + 100, status_y + 6), "已解析", font=get_font_index(36, 0), fill=ACCENT_COLOR)
    
    # Floating question icons
    questions = [
        "这篇论文的核心观点是什么？",
        "请总结第三页的关键公式",
        "如何理解文中的图2？",
    ]
    
    q_y = 1450
    q_x_positions = [400, 1100, 1800]
    for i, q in enumerate(questions):
        x = q_x_positions[i]
        # Question bubble
        q_font = get_font_index(44, 0)
        bbox = draw.textbbox((0, 0), q, font=q_font)
        q_width = bbox[2] - bbox[0] + 80
        q_height = 90
        
        draw_rounded_rect(draw, [x, q_y, x + q_width, q_y + q_height], 45, (245, 245, 250, 255), shadow=True)
        
        # Question mark icon
        icon_size = 50
        draw.ellipse([x + 20, q_y + 20, x + 20 + icon_size, q_y + 20 + icon_size], fill=ACCENT_COLOR)
        draw.text((x + 30, q_y + 18), "?", font=get_font_index(36, 0), fill=SURFACE_WHITE)
        
        draw.text((x + 85, q_y + 20), q, font=q_font, fill=PRIMARY_TEXT)
        q_y += 160
    
    img.save(os.path.join(OUTPUT_DIR, "04-pdf.png"))
    print("Generated: 04-pdf.png")


# ====== 05 - AGENT ======
def generate_05_agent():
    img, draw = create_base_canvas()
    
    # Title
    title_font = get_font_index(120, 0)
    y = 220
    draw_text_centered(draw, "工具调用，可控可靠", title_font, PRIMARY_TEXT, y)
    
    # 4 agent cards in 2x2 grid
    card_width = 1200
    card_height = 500
    gap_x = 100
    gap_y = 80
    grid_start_x = (SIZE - (2 * card_width + gap_x)) // 2
    grid_start_y = 550
    
    agents = [
        ("自动执行", "AI 自动调用工具完成\n复杂任务流程"),
        ("会话预审批", "关键操作前确认，\n确保每一步可控"),
        ("Artifact 保存", "生成内容自动保存，\n便于后续使用"),
        ("文件删除", "安全删除临时文件，\n保护数据隐私"),
    ]
    
    for i, (title, desc) in enumerate(agents):
        row = i // 2
        col = i % 2
        x = grid_start_x + col * (card_width + gap_x)
        y = grid_start_y + row * (card_height + gap_y)
        
        draw_rounded_rect(draw, [x, y, x + card_width, y + card_height], 40, SURFACE_WHITE, shadow=True)
        
        # Lock icon (circle with lock)
        icon_x = x + 80
        icon_y = y + 80
        icon_size = 80
        draw.ellipse([icon_x, icon_y, icon_x + icon_size, icon_y + icon_size], fill=LIGHT_ACCENT_BG)
        
        # Lock body
        lock_x = icon_x + 20
        lock_y = icon_y + 30
        draw.rounded_rectangle([lock_x, lock_y, lock_x + 40, lock_y + 35], radius=5, fill=ACCENT_COLOR)
        draw.arc([lock_x + 5, lock_y - 20, lock_x + 35, lock_y + 15], start=0, end=180, fill=ACCENT_COLOR, width=4)
        
        # Title
        title_font = get_font_index(64, 0)
        draw.text((x + 200, y + 75), title, font=title_font, fill=PRIMARY_TEXT)
        
        # Description
        desc_font = get_font_index(48, 0)
        lines = desc.split('\n')
        desc_y = y + 180
        for line in lines:
            draw.text((x + 80, desc_y), line, font=desc_font, fill=SECONDARY_TEXT)
            desc_y += 70
        
        # Bottom indicator
        indicator_y = y + card_height - 80
        draw.rounded_rectangle([x + 80, indicator_y, x + 280, indicator_y + 50], 
                               radius=25, fill=LIGHT_ACCENT_BG)
        draw.text((x + 120, indicator_y + 5), "安全可控", font=get_font_index(36, 0), fill=ACCENT_COLOR)
    
    img.save(os.path.join(OUTPUT_DIR, "05-agent.png"))
    print("Generated: 05-agent.png")


# ====== 06 - PAPER ======
def generate_06_paper():
    img, draw = create_base_canvas()
    
    # Title
    title_font = get_font_index(140, 0)
    y = 220
    draw_text_centered(draw, "论文精读", title_font, PRIMARY_TEXT, y)
    
    subtitle_font = get_font_index(64, 0)
    y = 420
    draw_text_centered(draw, "AI辅助论文解析与理解", subtitle_font, SECONDARY_TEXT, y)
    
    # 3 stages with timeline
    stages = [
        ("上传", "一键导入论文\n支持 PDF/Word"),
        ("分块", "智能分段解析\n提取核心论点"),
        ("交互", "问答式精读\n深入理解细节"),
    ]
    
    stage_y = 700
    stage_width = 700
    stage_height = 500
    gap = 120
    start_x = (SIZE - (3 * stage_width + 2 * gap)) // 2
    
    # Timeline line
    timeline_y = stage_y + stage_height + 100
    line_start = start_x + stage_width // 2
    line_end = start_x + 2 * gap + 2 * stage_width + stage_width // 2
    draw.line([(line_start, timeline_y), (line_end, timeline_y)], fill=ACCENT_COLOR, width=6)
    
    for i, (title, desc) in enumerate(stages):
        x = start_x + i * (stage_width + gap)
        
        # Card
        draw_rounded_rect(draw, [x, stage_y, x + stage_width, stage_y + stage_height], 
                          40, SURFACE_WHITE, shadow=True)
        
        # Stage number
        num_size = 80
        num_x = x + (stage_width - num_size) // 2
        num_y = stage_y + 50
        draw.ellipse([num_x, num_y, num_x + num_size, num_y + num_size], fill=ACCENT_COLOR)
        num_font = get_font_index(48, 0)
        draw.text((num_x + 28, num_y + 15), str(i + 1), font=num_font, fill=SURFACE_WHITE)
        
        # Title
        title_font = get_font_index(60, 0)
        draw_text_centered(draw, title, title_font, PRIMARY_TEXT, stage_y + 160, 
                           center_x=x + stage_width // 2)
        
        # Description
        desc_font = get_font_index(44, 0)
        lines = desc.split('\n')
        desc_y = stage_y + 260
        for line in lines:
            draw_text_centered(draw, line, desc_font, SECONDARY_TEXT, desc_y, 
                               center_x=x + stage_width // 2)
            desc_y += 60
        
        # Timeline dot
        dot_x = x + stage_width // 2
        dot_y = timeline_y
        dot_radius = 20
        draw.ellipse([dot_x - dot_radius, dot_y - dot_radius, 
                      dot_x + dot_radius, dot_y + dot_radius], fill=ACCENT_COLOR)
        
        # Draw line from card to dot
        draw.line([(dot_x, stage_y + stage_height), (dot_x, timeline_y - dot_radius)], 
                  fill=DOT_GRID_COLOR, width=4)
    
    # Bottom paper illustration
    paper_x = (SIZE - 1000) // 2
    paper_y = 1550
    draw.rounded_rectangle([paper_x, paper_y, paper_x + 1000, paper_y + 700], 
                           radius=30, fill=SURFACE_WHITE)
    # Paper lines
    line_y = paper_y + 80
    for j in range(8):
        line_width = 800 - (j % 3) * 150
        draw.rounded_rectangle([paper_x + 100, line_y, paper_x + 100 + line_width, line_y + 20], 
                             radius=10, fill=(220, 220, 230, 255))
        line_y += 60
    
    # Highlighted section
    highlight_y = paper_y + 320
    draw.rounded_rectangle([paper_x + 100, highlight_y, paper_x + 900, highlight_y + 120], 
                           radius=15, fill=(255, 255, 220, 255))
    draw.text((paper_x + 140, highlight_y + 30), "AI 自动提取核心论点和创新点", 
              font=get_font_index(44, 0), fill=PRIMARY_TEXT)
    
    img.save(os.path.join(OUTPUT_DIR, "06-paper.png"))
    print("Generated: 06-paper.png")


# ====== 07 - EXAM ======
def generate_07_exam():
    img, draw = create_base_canvas()
    
    # Title
    title_font = get_font_index(140, 0)
    y = 220
    draw_text_centered(draw, "智能出题", title_font, PRIMARY_TEXT, y)
    
    subtitle_font = get_font_index(64, 0)
    y = 420
    draw_text_centered(draw, "AI出题，基于项目文档，学习更高效", subtitle_font, SECONDARY_TEXT, y)
    
    # 2 question cards
    card_width = 1200
    card_height = 600
    card_y = 620
    gap = 120
    start_x = (SIZE - (2 * card_width + gap)) // 2
    
    # Left card: multiple choice
    x = start_x
    draw_rounded_rect(draw, [x, card_y, x + card_width, card_y + card_height], 
                      40, SURFACE_WHITE, shadow=True)
    
    # Card header
    draw.rounded_rectangle([x, card_y, x + card_width, card_y + 100], 
                           radius=40, fill=ACCENT_COLOR)
    # Fix: redraw top corners only, or just draw full header
    # Actually, let's draw a full header with the accent
    draw.rectangle([x + 40, card_y, x + card_width - 40, card_y + 100], fill=ACCENT_COLOR)
    draw.ellipse([x, card_y, x + 80, card_y + 80], fill=ACCENT_COLOR)
    draw.ellipse([x + card_width - 80, card_y, x + card_width, card_y + 80], fill=ACCENT_COLOR)
    
    header_font = get_font_index(52, 0)
    draw.text((x + 60, card_y + 25), "选择题", font=header_font, fill=SURFACE_WHITE)
    
    # Question text
    q_font = get_font_index(48, 0)
    draw.text((x + 60, card_y + 140), "以下哪个算法常用于图像分类任务？", 
              font=q_font, fill=PRIMARY_TEXT)
    
    # Options
    opt_font = get_font_index(44, 0)
    options = ["A. K-means 聚类", "B. 卷积神经网络 (CNN)", "C. 线性回归", "D. 决策树"]
    opt_y = card_y + 240
    for opt in options:
        # Radio circle
        draw.ellipse([x + 60, opt_y + 5, x + 100, opt_y + 45], fill=SURFACE_WHITE, outline=ACCENT_COLOR, width=3)
        if opt.startswith("B"):
            draw.ellipse([x + 70, opt_y + 15, x + 90, opt_y + 35], fill=ACCENT_COLOR)
        draw.text((x + 130, opt_y), opt, font=opt_font, fill=PRIMARY_TEXT)
        opt_y += 80
    
    # Right card: essay question
    x = start_x + card_width + gap
    draw_rounded_rect(draw, [x, card_y, x + card_width, card_y + card_height], 
                      40, SURFACE_WHITE, shadow=True)
    
    draw.rectangle([x + 40, card_y, x + card_width - 40, card_y + 100], fill=ACCENT_COLOR)
    draw.ellipse([x, card_y, x + 80, card_y + 80], fill=ACCENT_COLOR)
    draw.ellipse([x + card_width - 80, card_y, x + card_width, card_y + 80], fill=ACCENT_COLOR)
    
    draw.text((x + 60, card_y + 25), "问答题", font=header_font, fill=SURFACE_WHITE)
    
    draw.text((x + 60, card_y + 140), "请简述反向传播算法的基本原理，", 
              font=q_font, fill=PRIMARY_TEXT)
    draw.text((x + 60, card_y + 210), "并说明其在深度学习中的作用。", 
              font=q_font, fill=PRIMARY_TEXT)
    
    # Answer area
    ans_y = card_y + 340
    draw.rounded_rectangle([x + 60, ans_y, x + card_width - 60, card_y + card_height - 60], 
                           radius=20, fill=(250, 250, 252, 255))
    draw.text((x + 90, ans_y + 30), "AI 将基于项目文档自动评分...", 
              font=opt_font, fill=SECONDARY_TEXT)
    
    # Notebook icon at bottom left
    nb_x, nb_y = 300, 1600
    # Notebook cover
    draw.rounded_rectangle([nb_x, nb_y, nb_x + 500, nb_y + 650], radius=20, fill=(90, 95, 225, 60))
    # Pages
    draw.rounded_rectangle([nb_x + 30, nb_y + 30, nb_x + 470, nb_y + 620], radius=15, fill=SURFACE_WHITE)
    # Lines
    line_y = nb_y + 100
    for j in range(8):
        draw.line([(nb_x + 80, line_y), (nb_x + 420, line_y)], fill=(220, 220, 230, 255), width=3)
        line_y += 60
    
    # Pencil icon
    pencil_x, pencil_y = nb_x + 350, nb_y - 50
    draw.polygon([(pencil_x, pencil_y), (pencil_x + 40, pencil_y + 100), 
                  (pencil_x - 40, pencil_y + 100)], fill=(255, 200, 100, 255))
    
    img.save(os.path.join(OUTPUT_DIR, "07-exam.png"))
    print("Generated: 07-exam.png")


# ====== 08 - SOCRATIC ======
def generate_08_socratic():
    img, draw = create_base_canvas()
    
    # Title
    title_font = get_font_index(120, 0)
    y = 220
    draw_text_centered(draw, "苏格拉底式对话", title_font, PRIMARY_TEXT, y)
    
    subtitle_font = get_font_index(64, 0)
    y = 420
    draw_text_centered(draw, "引导式思考，深入理解", subtitle_font, SECONDARY_TEXT, y)
    
    # Conversation bubbles
    bubble_width = 1400
    bubble_radius = 50
    
    # AI question bubble 1
    ai1_y = 620
    ai1_x = 200
    draw_rounded_rect(draw, [ai1_x, ai1_y, ai1_x + bubble_width, ai1_y + 180], 
                      bubble_radius, SURFACE_WHITE, shadow=True)
    
    # AI avatar
    av_x = ai1_x - 140
    av_y = ai1_y + 40
    draw.ellipse([av_x, av_y, av_x + 100, av_y + 100], fill=ACCENT_COLOR)
    draw.text((av_x + 18, av_y + 22), "AI", font=get_font_index(40, 0), fill=SURFACE_WHITE)
    
    q1_font = get_font_index(52, 0)
    draw.text((ai1_x + 50, ai1_y + 55), "你认为什么是'学习'的本质？", 
              font=q1_font, fill=PRIMARY_TEXT)
    
    # User response bubble
    user_y = 860
    user_x = SIZE - bubble_width - 200
    draw_rounded_rect(draw, [user_x, user_y, user_x + bubble_width - 200, user_y + 160], 
                      bubble_radius, (240, 240, 245, 255), shadow=True)
    
    # User avatar
    uav_x = user_x + bubble_width - 140
    uav_y = user_y + 30
    draw.ellipse([uav_x, uav_y, uav_x + 100, uav_y + 100], fill=DOT_GRID_COLOR)
    draw.text((uav_x + 25, uav_y + 20), "我", font=get_font_index(48, 0), fill=SECONDARY_TEXT)
    
    draw.text((user_x + 50, user_y + 50), "获取知识并能够应用？", 
              font=q1_font, fill=PRIMARY_TEXT)
    
    # AI follow-up bubble
    ai2_y = 1080
    ai2_x = 200
    draw_rounded_rect(draw, [ai2_x, ai2_y, ai2_x + bubble_width + 100, ai2_y + 220], 
                      bubble_radius, SURFACE_WHITE, shadow=True)
    
    draw.ellipse([av_x, ai2_y + 40, av_x + 100, ai2_y + 140], fill=ACCENT_COLOR)
    draw.text((av_x + 18, ai2_y + 62), "AI", font=get_font_index(40, 0), fill=SURFACE_WHITE)
    
    follow_font = get_font_index(48, 0)
    draw.text((ai2_x + 50, ai2_y + 40), "很好。那么如果知识无法应用，", 
              font=follow_font, fill=PRIMARY_TEXT)
    draw.text((ai2_x + 50, ai2_y + 110), "还算真正的'学习'吗？再想想...", 
              font=follow_font, fill=PRIMARY_TEXT)
    
    # Decorative thinking elements
    # Lightbulb icon
    bulb_x, bulb_y = 2200, 1500
    draw.ellipse([bulb_x, bulb_y, bulb_x + 120, bulb_y + 120], fill=(255, 220, 100, 255))
    draw.rectangle([bulb_x + 40, bulb_y + 100, bulb_x + 80, bulb_y + 140], fill=(180, 180, 190, 255))
    # Glow
    for r in range(160, 200, 15):
        alpha = int(40 - (r - 160) * 1)
        draw.ellipse([bulb_x - (r-120)//2, bulb_y - (r-120)//2, 
                      bulb_x + 120 + (r-120)//2, bulb_y + 120 + (r-120)//2], 
                     outline=(255, 220, 100, alpha), width=2)
    
    # Question marks floating
    qm_font = get_font_index(80, 0)
    for qx, qy in [(350, 1500), (500, 1700), (650, 1550)]:
        draw.text((qx, qy), "?", font=qm_font, fill=LIGHT_ACCENT)
    
    img.save(os.path.join(OUTPUT_DIR, "08-socratic.png"))
    print("Generated: 08-socratic.png")


# ====== 09 - RAG ======
def generate_09_rag():
    img, draw = create_base_canvas()
    
    # Title
    title_font = get_font_index(120, 0)
    y = 220
    draw_text_centered(draw, "上下文联结，精准回答", title_font, PRIMARY_TEXT, y)
    
    # RAG Network Diagram
    center_x = SIZE // 2
    center_y = 950
    
    # Draw connections first (behind nodes)
    node_positions = [
        (center_x - 500, center_y - 200),  # 检索
        (center_x + 500, center_y - 200),  # 整合
        (center_x, center_y + 300),        # 生成
    ]
    
    # Connection lines
    line_color = (200, 200, 220, 255)
    for i in range(3):
        for j in range(i + 1, 3):
            x1, y1 = node_positions[i]
            x2, y2 = node_positions[j]
            draw.line([(x1, y1), (x2, y2)], fill=line_color, width=6)
    
    # Central hub
    hub_radius = 80
    draw.ellipse([center_x - hub_radius, center_y - hub_radius, 
                  center_x + hub_radius, center_y + hub_radius], fill=ACCENT_COLOR)
    hub_font = get_font_index(40, 0)
    draw.text((center_x - 40, center_y - 25), "RAG", font=hub_font, fill=SURFACE_WHITE)
    
    # Nodes
    node_labels = ["检索", "整合", "生成"]
    node_colors = [
        (100, 120, 255, 255),
        (140, 100, 255, 255),
        (90, 200, 180, 255),
    ]
    
    for i, ((nx, ny), label, color) in enumerate(zip(node_positions, node_labels, node_colors)):
        node_radius = 120
        draw.ellipse([nx - node_radius, ny - node_radius, nx + node_radius, ny + node_radius], 
                     fill=SURFACE_WHITE, outline=color, width=8)
        
        # Inner color
        draw.ellipse([nx - 40, ny - 40, nx + 40, ny + 40], fill=color)
        
        # Label below
        label_font = get_font_index(56, 0)
        bbox = draw.textbbox((0, 0), label, font=label_font)
        text_w = bbox[2] - bbox[0]
        draw.text((nx - text_w // 2, ny + node_radius + 30), label, font=label_font, fill=PRIMARY_TEXT)
    
    # Connection labels on lines
    conn_labels = [("数据召回", center_x - 250, center_y - 250), 
                   ("知识融合", center_x + 250, center_y - 250),
                   ("结果输出", center_x, center_y + 50)]
    for label, lx, ly in conn_labels:
        label_font = get_font_index(40, 0)
        bbox = draw.textbbox((0, 0), label, font=label_font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        # Small background
        draw.rounded_rectangle([lx - text_w//2 - 15, ly - 10, lx + text_w//2 + 15, ly + text_h + 10], 
                               radius=15, fill=SURFACE_WHITE)
        draw.text((lx - text_w // 2, ly - 5), label, font=label_font, fill=SECONDARY_TEXT)
    
    # 3 search tags at bottom
    tag_y = 1550
    tag_height = 100
    tags = [
        ("关键词检索", ACCENT_COLOR),
        ("向量检索", (100, 120, 255, 255)),
        ("混合检索", (140, 100, 255, 255)),
    ]
    
    tag_start_x = 450
    tag_gap = 80
    for i, (tag, color) in enumerate(tags):
        tag_font = get_font_index(48, 0)
        bbox = draw.textbbox((0, 0), tag, font=tag_font)
        tag_width = bbox[2] - bbox[0] + 80
        x = tag_start_x + i * (tag_width + tag_gap)
        
        draw_rounded_rect(draw, [x, tag_y, x + tag_width, tag_y + tag_height], 
                          50, SURFACE_WHITE, shadow=True)
        
        # Color dot
        dot_r = 20
        draw.ellipse([x + 30, tag_y + 30, x + 30 + dot_r * 2, tag_y + 30 + dot_r * 2], fill=color)
        
        draw.text((x + 80, tag_y + 18), tag, font=tag_font, fill=PRIMARY_TEXT)
    
    # Decorative search icon at bottom right
    search_x, search_y = 2400, 1700
    draw.ellipse([search_x, search_y, search_x + 300, search_y + 300], fill=LIGHT_ACCENT_BG)
    # Magnifying glass
    draw.ellipse([search_x + 80, search_y + 80, search_x + 220, search_y + 220], 
                 fill=SURFACE_WHITE, outline=ACCENT_COLOR, width=10)
    draw.line([(search_x + 200, search_y + 200), (search_x + 260, search_y + 260)], 
              fill=ACCENT_COLOR, width=12)
    
    img.save(os.path.join(OUTPUT_DIR, "09-rag.png"))
    print("Generated: 09-rag.png")


if __name__ == "__main__":
    print("Starting LumenLab promotional image generation...")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Image size: {SIZE}x{SIZE}")
    
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
    print(f"Files saved to: {OUTPUT_DIR}")
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith('.png'):
            print(f"  - {f}")
