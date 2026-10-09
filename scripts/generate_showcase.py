import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_BANNER = os.path.abspath("assets/showcase_github.png")
SCREENSHOTS_DIR = os.path.abspath("assets/screenshots")

WIDTH = 2100
HEIGHT = 3200
BG_COLOR = (13, 17, 23)  # #0D1117 (GitHub Dark)

SCREENS_DATA = [
    {
        "file": "1_group_selection.png",
        "title": "1. Выбор группы",
        "subtitle": "3-уровневый фильтр: кафедра, курс и группа",
        "tag": "ONBOARDING"
    },
    {
        "file": "2_schedule_day.png",
        "title": "2. Дневное расписание",
        "subtitle": "Лента дат, индикаторы пар и таймер в реальном времени",
        "tag": "SCHEDULE"
    },
    {
        "file": "3_lesson_detail.png",
        "title": "3. Детали занятия",
        "subtitle": "Форм-шит модалка, преподаватель, аудитория и заметки",
        "tag": "LESSON MODAL"
    },
    {
        "file": "4_weekly_grid.png",
        "title": "4. Сетка недели",
        "subtitle": "6-дневный обзор нагрузки понедельник–суббота",
        "tag": "WEEKLY MATRIX"
    },
    {
        "file": "5_search_rooms.png",
        "title": "5. Поиск и аудитории",
        "subtitle": "Каталог преподавателей и детектор свободных залов",
        "tag": "DIRECTORY & ROOMS"
    },
    {
        "file": "6_settings.png",
        "title": "6. Настройки",
        "subtitle": "Темы OLED/Charcoal, подгруппы и размер кэша",
        "tag": "PREFERENCES"
    }
]

def get_font(name="segoeuib.ttf", size=24):
    font_path = os.path.join(r"C:\Windows\Fonts", name)
    if os.path.exists(font_path):
        return ImageFont.truetype(font_path, size)
    return ImageFont.load_default()

def create_rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), size], radius=radius, fill=255)
    return mask

def make_device_frame(screenshot_img, target_width=520, target_height=1127):
    # Resize screenshot
    resized_screen = screenshot_img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    # Screen rounded corners
    screen_radius = 36
    mask = create_rounded_mask((target_width, target_height), screen_radius)
    
    # Outer frame dimensions
    bezel = 14
    frame_w = target_width + bezel * 2
    frame_h = target_height + bezel * 2
    frame_radius = screen_radius + bezel
    
    # Base frame image with transparency
    frame_img = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame_img)
    
    # Draw phone chassis (Titanium Dark)
    chassis_color = (33, 38, 45)      # #21262D
    border_color = (65, 75, 90)       # #414B5A
    
    draw.rounded_rectangle(
        [(0, 0), (frame_w - 1, frame_h - 1)],
        radius=frame_radius,
        fill=chassis_color,
        outline=border_color,
        width=3
    )
    
    # Inner border line
    draw.rounded_rectangle(
        [(bezel - 1, bezel - 1), (frame_w - bezel, frame_h - bezel)],
        radius=screen_radius + 1,
        outline=(15, 18, 22),
        width=2
    )
    
    # Paste masked screenshot
    frame_img.paste(resized_screen, (bezel, bezel), mask)
    
    # Draw Dynamic Island on top
    di_w, di_h = 110, 26
    di_x = (frame_w - di_w) // 2
    di_y = bezel + 10
    draw.rounded_rectangle(
        [(di_x, di_y), (di_x + di_w, di_y + di_h)],
        radius=13,
        fill=(0, 0, 0),
        outline=(25, 25, 28),
        width=1
    )
    # Speaker / camera subtle dots
    draw.ellipse([(di_x + di_w - 22, di_y + 8), (di_x + di_w - 12, di_y + 18)], fill=(12, 14, 25))
    
    return frame_img

def main():
    print("Generating showcase banner...")
    banner = Image.new("RGBA", (WIDTH, HEIGHT), (*BG_COLOR, 255))
    draw = ImageDraw.Draw(banner)
    
    # Draw subtle top ambient glow
    glow_color = (16, 32, 60)
    for r in range(400, 0, -20):
        alpha = int(35 * (r / 400))
        draw.ellipse([(WIDTH // 2 - r * 2, -r), (WIDTH // 2 + r * 2, r * 2)], fill=(10, 84, 255, alpha))
    
    # Header Fonts
    font_badge = get_font("segoeuib.ttf", 18)
    font_title = get_font("segoeuib.ttf", 64)
    font_sub = get_font("segoeui.ttf", 24)
    font_card_tag = get_font("segoeuib.ttf", 16)
    font_card_title = get_font("segoeuib.ttf", 30)
    font_card_sub = get_font("segoeui.ttf", 20)
    
    # Top Tag Badge
    badge_text = "ULSU MOBILE SCHEDULE • AUTUMN 2026/2027"
    badge_w = 460
    badge_h = 36
    badge_x = (WIDTH - badge_w) // 2
    badge_y = 60
    draw.rounded_rectangle(
        [(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)],
        radius=18,
        fill=(22, 27, 34),
        outline=(88, 166, 255),
        width=1
    )
    draw.text((badge_x + 22, badge_y + 6), badge_text, font=font_badge, fill=(88, 166, 255))
    
    # Main Title
    title_text = "Расписание УлГУ • Версия 2.0"
    bbox_title = draw.textbbox((0, 0), title_text, font=font_title)
    title_x = (WIDTH - (bbox_title[2] - bbox_title[0])) // 2
    draw.text((title_x, 115), title_text, font=font_title, fill=(240, 246, 252))
    
    # Subtitle
    sub_text = "Apple iOS 18 Design • OLED Pitch Black (#000000) • 100% Автономный режим • 6 ключевых экранов"
    bbox_sub = draw.textbbox((0, 0), sub_text, font=font_sub)
    sub_x = (WIDTH - (bbox_sub[2] - bbox_sub[0])) // 2
    draw.text((sub_x, 205), sub_text, font=font_sub, fill=(139, 148, 158))
    
    # Badges Row
    tech_tags = [
        "Apple HIG Compliant",
        "React Native & Expo",
        "OLED Pitch Black",
        "Zero Cloud Dependency",
        "AsyncStorage Tasks"
    ]
    tag_gap = 14
    tag_total_w = 0
    tag_boxes = []
    for t in tech_tags:
        bbox = draw.textbbox((0, 0), t, font=font_card_tag)
        w = (bbox[2] - bbox[0]) + 26
        tag_boxes.append((t, w))
        tag_total_w += w + tag_gap
    tag_total_w -= tag_gap
    
    start_tag_x = (WIDTH - tag_total_w) // 2
    tag_y = 255
    curr_x = start_tag_x
    for t, w in tag_boxes:
        draw.rounded_rectangle([(curr_x, tag_y), (curr_x + w, tag_y + 30)], radius=8, fill=(22, 27, 34), outline=(48, 54, 61), width=1)
        draw.text((curr_x + 13, tag_y + 5), t, font=font_card_tag, fill=(201, 209, 217))
        curr_x += w + tag_gap
    
    # Grid coordinates
    col_width = 548  # device width
    col_gap = 120
    row_gap = 75
    left_margin = (WIDTH - (3 * col_width + 2 * col_gap)) // 2
    
    row_starts_y = [360, 1750]
    
    for idx, item in enumerate(SCREENS_DATA):
        col = idx % 3
        row = idx // 3
        
        pos_x = left_margin + col * (col_width + col_gap)
        pos_y = row_starts_y[row]
        
        # Load screenshot
        screen_path = os.path.join(SCREENSHOTS_DIR, item["file"])
        if not os.path.exists(screen_path):
            print(f"Warning: {screen_path} not found!")
            continue
            
        screen_img = Image.open(screen_path)
        phone = make_device_frame(screen_img, target_width=520, target_height=1127)
        
        # Shadow behind phone
        shadow = Image.new("RGBA", (phone.width + 30, phone.height + 30), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.rounded_rectangle([(15, 15), (phone.width + 15, phone.height + 15)], radius=50, fill=(0, 0, 0, 160))
        shadow = shadow.filter(ImageFilter.GaussianBlur(14))
        banner.paste(shadow, (pos_x - 15, pos_y - 5), shadow)
        
        # Paste phone
        banner.paste(phone, (pos_x, pos_y), phone)
        
        # Caption below phone
        caption_y = pos_y + phone.height + 24
        
        # Tag pill
        tag_t = item["tag"]
        bbox_tag = draw.textbbox((0, 0), tag_t, font=font_card_tag)
        tw = (bbox_tag[2] - bbox_tag[0]) + 16
        draw.rounded_rectangle([(pos_x, caption_y), (pos_x + tw, caption_y + 24)], radius=6, fill=(10, 132, 255, 30), outline=(10, 132, 255), width=1)
        draw.text((pos_x + 8, caption_y + 3), tag_t, font=font_card_tag, fill=(88, 166, 255))
        
        # Title
        draw.text((pos_x, caption_y + 34), item["title"], font=font_card_title, fill=(240, 246, 252))
        
        # Subtitle
        draw.text((pos_x, caption_y + 76), item["subtitle"], font=font_card_sub, fill=(139, 148, 158))

    # Convert to RGB and save
    final_banner = banner.convert("RGB")
    final_banner.save(OUTPUT_BANNER, "PNG", optimize=True)
    file_size_kb = os.path.getsize(OUTPUT_BANNER) / 1024
    print(f"Showcase banner saved to {OUTPUT_BANNER} ({file_size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
