import json

html_template = """<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ULSU Schedule • 6 Native Screen Showcase</title>
<style>
  :root {
    --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    --font-mono: "SF Mono", "JetBrains Mono", Menlo, monospace;
    --phone-bg: #000000;
    --phone-border: rgba(255, 255, 255, 0.14);
    --phone-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4);
    --accent-blue: #0A84FF;
    --accent-purple: #BF5AF2;
    --accent-green: #30D158;
    --accent-amber: #FF9F0A;
    --accent-red: #FF453A;
    --accent-cyan: #38BDF8;
    --card-dark: #1C1C1E;
    --card-hover: #2C2C2E;
    --card-border: rgba(255, 255, 255, 0.08);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }

  body {
    font-family: var(--font-sans);
    color: #FFFFFF;
    background: #0B0D13;
    padding: 12px 14px 24px 14px;
  }

  /* Header banner */
  .showcase-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 18px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .showcase-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .device-badge {
    background: linear-gradient(135deg, #0A84FF, #5E5CE6);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }

  .showcase-title {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.2px;
  }

  .showcase-sub {
    font-size: 12px;
    color: #8E8E93;
  }

  .controls-bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chip-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #A1A1AA;
    padding: 5px 11px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .chip-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .chip-btn.active {
    background: var(--accent-blue);
    border-color: var(--accent-blue);
    color: #fff;
  }

  /* Phone Grid (3 columns on desktop, 2 or 1 on mobile) */
  .screens-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (max-width: 720px) {
    .screens-grid {
      grid-template-columns: 1fr;
      justify-items: center;
    }
  }

  /* Authentic iPhone 16 Pro Bezel */
  .phone-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .phone-label {
    font-size: 11.5px;
    font-weight: 600;
    color: #9CA3AF;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .phone-frame {
    position: relative;
    width: 100%;
    max-width: 226px;
    height: 476px;
    background: var(--phone-bg);
    border-radius: 36px;
    border: 3px solid #2C2C2E;
    box-shadow: var(--phone-shadow), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    user-select: none;
    transition: background 0.25s;
  }

  /* Dynamic Island & iOS Status Bar */
  .status-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 38px;
    padding: 8px 12px 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    z-index: 20;
    pointer-events: none;
  }

  .time-text {
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .dynamic-island {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 72px;
    height: 18px;
    background: #000;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5px;
    z-index: 25;
  }

  .dynamic-island.expanded {
    width: 94px;
    height: 18px;
    padding: 0 5px;
  }

  .island-cam {
    width: 6px;
    height: 6px;
    background: #111;
    border-radius: 50%;
    box-shadow: inset 0 0 2px #0A84FF;
  }

  .status-icons {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 9px;
  }

  /* Phone screen content area */
  .screen-body {
    flex: 1;
    overflow-y: auto;
    padding: 40px 10px 16px 10px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    scrollbar-width: none;
  }

  .screen-body::-webkit-scrollbar {
    display: none;
  }

  /* iOS Home Indicator Bar */
  .home-indicator {
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 76px;
    height: 3.5px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 3px;
    z-index: 30;
    pointer-events: none;
  }

  /* Common Typography */
  .app-header {
    margin-bottom: 2px;
  }

  .app-small-title {
    font-size: 8.5px;
    font-weight: 700;
    color: #8E8E93;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .app-large-title {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: #FFFFFF;
    line-height: 1.2;
  }

  .section-tag {
    font-size: 8px;
    font-weight: 700;
    color: #8E8E93;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }

  /* Segmented Controls */
  .segmented-control {
    display: flex;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 7px;
    padding: 2px;
    gap: 2px;
  }

  .seg-btn {
    flex: 1;
    text-align: center;
    font-size: 9px;
    font-weight: 600;
    padding: 3px 0;
    border-radius: 5px;
    color: #8E8E93;
    cursor: pointer;
    white-space: nowrap;
  }

  .seg-btn.active {
    background: var(--accent-blue);
    color: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  /* Screen 1: Group Selection 3-Level */
  .dir-card {
    background: var(--card-dark);
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }

  .dir-card.active {
    border-color: var(--accent-blue);
    background: rgba(10, 132, 255, 0.1);
  }

  .dir-left {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .dir-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: rgba(10, 132, 255, 0.2);
    color: var(--accent-blue);
    font-size: 9.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dir-title {
    font-size: 11px;
    font-weight: 700;
  }

  .dir-sub {
    font-size: 8.5px;
    color: #8E8E93;
  }

  .group-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
  }

  .group-chip {
    background: var(--card-dark);
    border: 1px solid var(--card-border);
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .group-chip.active {
    border-color: var(--accent-blue);
    background: rgba(10, 132, 255, 0.15);
  }

  .group-name {
    font-size: 10.5px;
    font-weight: 700;
    color: #fff;
  }

  .group-meta {
    font-size: 8px;
    color: #8E8E93;
  }

  .btn-primary-hig {
    background: linear-gradient(135deg, #0A84FF, #5E5CE6);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 7px 10px;
    font-size: 10.5px;
    font-weight: 700;
    text-align: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(10, 132, 255, 0.35);
  }

  /* Screen 2: Day Carousel Strip */
  .day-strip {
    display: flex;
    gap: 3px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .day-capsule {
    min-width: 27px;
    padding: 3px 2px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    font-size: 8.5px;
    color: #8E8E93;
  }

  .day-capsule.active {
    background: var(--accent-blue);
    color: #fff;
    font-weight: 700;
  }

  /* Lesson Cards */
  .lesson-card {
    background: var(--card-dark);
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 7px 8px;
    display: flex;
    flex-direction: column;
    gap: 3.5px;
    position: relative;
  }

  .lesson-card.live {
    border-color: rgba(10, 132, 255, 0.6);
    background: linear-gradient(180deg, rgba(10, 132, 255, 0.12) 0%, #1C1C1E 100%);
    box-shadow: 0 0 10px rgba(10, 132, 255, 0.15);
  }

  .time-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5px;
    color: #8E8E93;
  }

  .type-badge {
    font-size: 7.5px;
    font-weight: 700;
    padding: 1.5px 5px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .badge-lec { background: rgba(10, 132, 255, 0.2); color: #0A84FF; }
  .badge-lab { background: rgba(48, 209, 88, 0.2); color: #30D158; }
  .badge-sem { background: rgba(255, 159, 10, 0.2); color: #FF9F0A; }
  .badge-pur { background: rgba(191, 90, 242, 0.2); color: #BF5AF2; }

  .lesson-subj {
    font-size: 10.5px;
    font-weight: 700;
    line-height: 1.25;
    color: #FFFFFF;
  }

  .meta-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5px;
    color: #A1A1AA;
  }

  .meta-teach {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .avatar-mini {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #3A3A3C;
    font-size: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
  }

  .room-tag {
    font-weight: 600;
    color: #60A5FA;
  }

  .live-bar {
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .live-bar-fill {
    height: 100%;
    background: var(--accent-blue);
    border-radius: 2px;
  }

  /* Screen 3: Weekly Grid */
  .week-group {
    display: flex;
    flex-direction: column;
    gap: 1.5px;
    border-left: 2px solid var(--accent-blue);
    padding-left: 5px;
    margin-bottom: 2px;
  }

  .week-day-title {
    font-size: 7.5px;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
    color: #8E8E93;
  }

  .week-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.04);
    padding: 1.5px 4px;
    border-radius: 4px;
    font-size: 7.5px;
  }

  .week-subj {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 125px;
  }

  /* Screen 4: Detail Modal / Live View */
  .modal-sheet {
    background: #1C1C1E;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 8px 9px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sheet-header-pill {
    width: 26px;
    height: 3px;
    background: #3A3A3C;
    border-radius: 2px;
    align-self: center;
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(255, 255, 255, 0.04);
    padding: 5px 7px;
    border-radius: 7px;
  }

  .detail-icon {
    font-size: 13px;
  }

  .detail-text-main {
    font-size: 9.5px;
    font-weight: 700;
    color: #fff;
  }

  .detail-text-sub {
    font-size: 8px;
    color: #8E8E93;
  }

  .checklist-box {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 5px 7px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .checklist-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 8.5px;
    color: #D1D5DB;
  }

  .check-icon {
    font-size: 9px;
  }

  /* Screen 5: Search & Directory */
  .search-box {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 7px;
    padding: 4px 7px;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 9px;
    color: #8E8E93;
  }

  .search-input {
    background: transparent;
    border: none;
    color: #fff;
    font-size: 9px;
    outline: none;
    width: 100%;
  }

  .filter-chips {
    display: flex;
    gap: 2.5px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filter-chip {
    font-size: 7.5px;
    font-weight: 600;
    padding: 2.5px 5px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.06);
    color: #8E8E93;
    white-space: nowrap;
    cursor: pointer;
  }

  .filter-chip.active {
    background: var(--accent-blue);
    color: #fff;
  }

  .dir-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--card-dark);
    padding: 5px 7px;
    border-radius: 7px;
    font-size: 9px;
  }

  .room-status-pill {
    font-size: 7.5px;
    font-weight: 700;
    padding: 1.5px 5px;
    border-radius: 4px;
  }

  .status-free {
    background: rgba(48, 209, 88, 0.15);
    color: #30D158;
  }

  .status-busy {
    background: rgba(255, 69, 58, 0.15);
    color: #FF453A;
  }

  /* Screen 6: Settings */
  .settings-group {
    background: var(--card-dark);
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .settings-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    padding: 2px 0;
  }

  .settings-row:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 4px;
  }

  .toggle-switch {
    width: 26px;
    height: 15px;
    background: var(--accent-green);
    border-radius: 10px;
    position: relative;
    cursor: pointer;
  }

  .toggle-knob {
    width: 11px;
    height: 11px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    right: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }
</style>
</head>
<body>

<div class="showcase-header">
  <div class="showcase-title-wrap">
    <span class="device-badge">iOS 18 PRO</span>
    <div>
      <div class="showcase-title">ULSU Schedule • Нативные экраны приложения (6 Экранов)</div>
      <div class="showcase-sub">Фактическое расписание Осенний семестр 2026/2027 • ПМ-О-26/1</div>
    </div>
  </div>
  <div class="controls-bar">
    <button class="chip-btn active" onclick="switchTheme('dark')">Dark OLED</button>
    <button class="chip-btn" onclick="toggleSim()">Симуляция пары</button>
  </div>
</div>

<div class="screens-grid">

  <!-- PHONE 1: GROUP SELECTION SCREEN -->
  <div class="phone-wrapper">
    <div class="phone-label">
      <span>1️⃣</span> 1. GroupSelectionScreen
    </div>
    <div class="phone-frame">
      <div class="status-bar">
        <span class="time-text">9:41</span>
        <div class="dynamic-island"><div class="island-cam"></div></div>
        <div class="status-icons"><span>5G</span><span>100%</span></div>
      </div>
      <div class="screen-body">
        <div class="app-header">
          <div class="app-small-title">ФМИАТ • УлГУ</div>
          <div class="app-large-title">Выбор группы</div>
        </div>

        <div class="section-tag">1. Направление</div>
        <div class="dir-card active">
          <div class="dir-left">
            <div class="dir-icon">ПМ</div>
            <div>
              <div class="dir-title">Прикладная математика</div>
              <div class="dir-sub">Кафедра ПМ • 1–4 курсы</div>
            </div>
          </div>
          <span style="color:var(--accent-blue); font-size:11px;">✓</span>
        </div>

        <div class="dir-card">
          <div class="dir-left">
            <div class="dir-icon" style="background:rgba(191,90,242,0.2); color:#BF5AF2;">ИС</div>
            <div>
              <div class="dir-title">Информационные системы</div>
              <div class="dir-sub">Кафедра ИТ • 1–4 курсы</div>
            </div>
          </div>
          <span style="color:#8E8E93; font-size:9px;">›</span>
        </div>

        <div class="section-tag">2. Курс обучения</div>
        <div class="segmented-control">
          <div class="seg-btn active">1 курс</div>
          <div class="seg-btn">2 курс</div>
          <div class="seg-btn">3 курс</div>
          <div class="seg-btn">4 курс</div>
        </div>

        <div class="section-tag">3. Группа (Устранение бага скрытия)</div>
        <div class="group-grid">
          <div class="group-chip active">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="group-name">ПМ-О-26/1</span>
              <span style="color:var(--accent-blue); font-size:9px;">✓</span>
            </div>
            <span class="group-meta">26 студ. • 1 смена</span>
          </div>
          <div class="group-chip">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="group-name">ПМ-О-26/2</span>
              <span style="color:#8E8E93; font-size:9px;">›</span>
            </div>
            <span class="group-meta">24 студ. • 1 смена</span>
          </div>
        </div>

        <div class="btn-primary-hig">Открыть расписание</div>
      </div>
      <div class="home-indicator"></div>
    </div>
  </div>

  <!-- PHONE 2: SCHEDULE SCREEN -->
  <div class="phone-wrapper">
    <div class="phone-label">
      <span>2️⃣</span> 2. ScheduleScreen (Дневной Live)
    </div>
    <div class="phone-frame">
      <div class="status-bar">
        <span class="time-text">9:41</span>
        <div class="dynamic-island"><div class="island-cam"></div></div>
        <div class="status-icons"><span>5G</span><span>100%</span></div>
      </div>
      <div class="screen-body">
        <div class="app-header">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="app-small-title">ПМ-О-26/1</div>
            <div class="segmented-control" style="width:105px;">
              <div class="seg-btn active">1 Неделя</div>
              <div class="seg-btn">2 Нед.</div>
            </div>
          </div>
          <div class="app-large-title">Вторник, 13 окт</div>
        </div>

        <!-- Subgroup segmented filter -->
        <div class="segmented-control">
          <div class="seg-btn active">Все (4)</div>
          <div class="seg-btn">1 подгруппа</div>
          <div class="seg-btn">2 подгруппа</div>
        </div>

        <!-- Days strip -->
        <div class="day-strip">
          <div class="day-capsule"><span>Пн</span><span>12</span></div>
          <div class="day-capsule active"><span>Вт</span><span>13</span></div>
          <div class="day-capsule"><span>Ср</span><span>14</span></div>
          <div class="day-capsule"><span>Чт</span><span>15</span></div>
          <div class="day-capsule"><span>Пт</span><span>16</span></div>
          <div class="day-capsule"><span>Сб</span><span>17</span></div>
        </div>

        <!-- Pair 1 -->
        <div class="lesson-card">
          <div class="time-row">
            <span>08:00 – 09:20 • 1 пара</span>
            <span class="type-badge badge-sem">Семинар</span>
          </div>
          <div class="lesson-subj">Информатика и программирование</div>
          <div class="meta-footer">
            <div class="meta-teach">
              <div class="avatar-mini">БВ</div>
              <span>В.Г. Бурмистрова</span>
            </div>
            <span class="room-tag">ауд. 3/316</span>
          </div>
        </div>

        <!-- Pair 2 (Live) -->
        <div class="lesson-card live" id="liveCard">
          <div class="time-row">
            <span style="color:var(--accent-blue); font-weight:700;">09:30 – 10:50 • Идет пара (35м)</span>
            <span class="type-badge badge-lab">Лаб 1п</span>
          </div>
          <div class="live-bar"><div class="live-bar-fill" style="width: 58%;"></div></div>
          <div class="lesson-subj">1С: Предприятие для разработчиков</div>
          <div class="meta-footer">
            <div class="meta-teach">
              <div class="avatar-mini" style="background:#0A84FF;">НН</div>
              <span>Н.Н. Нечаева</span>
            </div>
            <span class="room-tag">лаб. 3/118</span>
          </div>
        </div>

        <!-- Pair 3 -->
        <div class="lesson-card">
          <div class="time-row">
            <span>11:00 – 12:20 • 3 пара</span>
            <span class="type-badge badge-pur">Семинар</span>
          </div>
          <div class="lesson-subj">Математический анализ</div>
          <div class="meta-footer">
            <div class="meta-teach">
              <div class="avatar-mini">ФЮ</div>
              <span>Ю.Ю. Фролова</span>
            </div>
            <span class="room-tag">ауд. 332</span>
          </div>
        </div>

        <!-- Pair 4 -->
        <div class="lesson-card">
          <div class="time-row">
            <span>12:45 – 14:05 • 4 пара</span>
            <span class="type-badge badge-lec">Лекция</span>
          </div>
          <div class="lesson-subj">Информатика и программирование</div>
          <div class="meta-footer">
            <div class="meta-teach">
              <div class="avatar-mini">СИ</div>
              <span>И.А. Санников</span>
            </div>
            <span class="room-tag">лек. 332</span>
          </div>
        </div>
      </div>
      <div class="home-indicator"></div>
    </div>
  </div>

  <!-- PHONE 3: WEEKLY GRID SCREEN -->
  <div class="phone-wrapper">
    <div class="phone-label">
      <span>3️⃣</span> 3. WeeklyGridScreen (Сетка недели)
    </div>
    <div class="phone-frame">
      <div class="status-bar">
        <span class="time-text">9:41</span>
        <div class="dynamic-island"><div class="island-cam"></div></div>
        <div class="status-icons"><span>5G</span><span>100%</span></div>
      </div>
      <div class="screen-body">
        <div class="app-header">
          <div class="app-small-title">ПМ-О-26/1 • 1 НЕДЕЛЯ</div>
          <div class="app-large-title">Сетка недели</div>
        </div>

        <div class="week-group" style="border-left-color:#0A84FF;">
          <div class="week-day-title"><span style="color:#60A5FA;">ПОНЕДЕЛЬНИК</span><span>3 пары</span></div>
          <div class="week-row"><span class="week-subj">#2 Алгебра и геометрия</span><span>332</span></div>
          <div class="week-row"><span class="week-subj">#3 Информатика (лаб)</span><span>503</span></div>
          <div class="week-row"><span class="week-subj">#4 Программир. Python</span><span>3/127</span></div>
        </div>

        <div class="week-group" style="border-left-color:#30D158;">
          <div class="week-day-title" style="color:#30D158;"><span>ВТОРНИК</span><span>4 пары</span></div>
          <div class="week-row"><span class="week-subj">#1 Информатика и прогр.</span><span>3/316</span></div>
          <div class="week-row"><span class="week-subj">#2 1С: Предприятие (1п)</span><span>3/118</span></div>
          <div class="week-row"><span class="week-subj">#3 Математический анализ</span><span>332</span></div>
          <div class="week-row"><span class="week-subj">#4 Информатика (лек)</span><span>332</span></div>
        </div>

        <div class="week-group" style="border-left-color:#FF9F0A;">
          <div class="week-day-title" style="color:#FF9F0A;"><span>СРЕДА</span><span>3 пары</span></div>
          <div class="week-row"><span class="week-subj">#2 Дискретная матем.</span><span>332</span></div>
          <div class="week-row"><span class="week-subj">#3 Алгебра и геометрия</span><span>3/418</span></div>
          <div class="week-row"><span class="week-subj">#4 Математический анализ</span><span>3/316</span></div>
        </div>

        <div class="week-group" style="border-left-color:#BF5AF2;">
          <div class="week-day-title" style="color:#BF5AF2;"><span>ЧЕТВЕРГ</span><span>3 пары</span></div>
          <div class="week-row"><span class="week-subj">#1 Физкультура и спорт</span><span>С/к</span></div>
          <div class="week-row"><span class="week-subj">#2 Аппаратные ср-ва</span><span>332</span></div>
          <div class="week-row"><span class="week-subj">#3 История России</span><span>2/26</span></div>
        </div>

        <div class="week-group" style="border-left-color:#FF453A;">
          <div class="week-day-title" style="color:#FF453A;"><span>ПЯТНИЦА</span><span>2 пары</span></div>
          <div class="week-row"><span class="week-subj">#3 Аппаратные ср-ва</span><span>3/118</span></div>
          <div class="week-row"><span class="week-subj">#4 Математический анализ</span><span>332</span></div>
        </div>

        <div class="week-group" style="border-left-color:#FFD60A;">
          <div class="week-day-title" style="color:#FFD60A;"><span>СУББОТА</span><span>2 пары</span></div>
          <div class="week-row"><span class="week-subj">#1 Русский язык</span><span>2/26</span></div>
          <div class="week-row"><span class="week-subj">#2 Русский язык</span><span>2/26</span></div>
        </div>
      </div>
      <div class="home-indicator"></div>
    </div>
  </div>

  <!-- PHONE 4: LESSON DETAIL SHEET -->
  <div class="phone-wrapper">
    <div class="phone-label">
      <span>4️⃣</span> 4. LessonDetailSheet (Шторка + Island)
    </div>
    <div class="phone-frame">
      <div class="status-bar">
        <span class="time-text">9:41</span>
        <div class="dynamic-island expanded">
          <span style="font-size:7px; color:#30D158; font-weight:700;">● 1С: Лаб</span>
          <span style="font-size:7px; color:#A1A1AA;">28м ост.</span>
        </div>
        <div class="status-icons"><span>5G</span><span>100%</span></div>
      </div>
      <div class="screen-body" style="padding-top:38px;">
        <div class="modal-sheet">
          <div class="sheet-header-pill"></div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="type-badge badge-lab">Лабораторная работа</span>
            <span style="font-size:8.5px; color:#8E8E93;">2 пара • 09:30–10:50</span>
          </div>
          <div style="font-size:11px; font-weight:800; line-height:1.2;">
            1С: Предприятие для разработчиков
          </div>

          <div class="detail-row">
            <div class="avatar-mini" style="width:20px; height:20px; font-size:8px; background:#0A84FF;">НН</div>
            <div>
              <div class="detail-text-main">Нечаева Надежда Николаевна</div>
              <div class="detail-text-sub">Доцент каф. информационных технологий • ФМИАТ</div>
            </div>
          </div>

          <div class="detail-row">
            <span class="detail-icon">📍</span>
            <div>
              <div class="detail-text-main">Аудитория 3/118 (Лаборатория 1С)</div>
              <div class="detail-text-sub">Корпус 3 • 1-й этаж, правое крыло</div>
            </div>
          </div>

          <div class="detail-row">
            <span class="detail-icon">👥</span>
            <div>
              <div class="detail-text-main">1 подгруппа</div>
              <div class="detail-text-sub">2 подгруппа: ауд. 505 (В.Г. Бурмистрова)</div>
            </div>
          </div>

          <div class="checklist-box">
            <span style="color:#60A5FA; font-weight:700; font-size:8px;">✓ Задачи и домашнее задание:</span>
            <div class="checklist-item">
              <span class="check-icon" style="color:#30D158;">☑</span>
              <span>Изучить регистры сведений (Выполнено)</span>
            </div>
            <div class="checklist-item">
              <span class="check-icon" style="color:#8E8E93;">☐</span>
              <span>Настроить проведение накладной</span>
            </div>
          </div>

          <div style="background:rgba(10,132,255,0.1); border:1px solid rgba(10,132,255,0.3); border-radius:7px; padding:4px 6px; font-size:8px;">
            <span style="color:#60A5FA; font-weight:700;">💡 Заметка студента:</span>
            <div style="color:#D1D5DB; margin-top:1px;">Сдать отчет преподавателю в конце пары.</div>
          </div>
        </div>
      </div>
      <div class="home-indicator"></div>
    </div>
  </div>

  <!-- PHONE 5: SEARCH SCREEN -->
  <div class="phone-wrapper">
    <div class="phone-label">
      <span>5️⃣</span> 5. SearchScreen (Поиск & Аудитории)
    </div>
    <div class="phone-frame">
      <div class="status-bar">
        <span class="time-text">9:41</span>
        <div class="dynamic-island"><div class="island-cam"></div></div>
        <div class="status-icons"><span>5G</span><span>100%</span></div>
      </div>
      <div class="screen-body">
        <div class="app-header">
          <div class="app-small-title">СПРАВОЧНИК • УлГУ</div>
          <div class="app-large-title">Поиск и аудитории</div>
        </div>

        <div class="search-box">
          <span>🔍</span>
          <input type="text" class="search-input" placeholder="Санников, 332, лаб 505..." value="Санников">
        </div>

        <div class="filter-chips">
          <div class="filter-chip">Все</div>
          <div class="filter-chip active">Преподаватели</div>
          <div class="filter-chip">Аудитории</div>
          <div class="filter-chip">Свободные</div>
        </div>

        <div class="section-tag">Преподаватели</div>
        <div class="dir-item">
          <div>
            <div style="font-weight:700; color:#fff;">Санников И.А.</div>
            <div style="font-size:8px; color:#8E8E93;">Доцент каф. ИТ • лек. 332, лаб. 601</div>
          </div>
          <span style="color:var(--accent-blue); font-size:9.5px;">Расписание ›</span>
        </div>
        <div class="dir-item">
          <div>
            <div style="font-weight:700; color:#fff;">Нечаева Н.Н.</div>
            <div style="font-size:8px; color:#8E8E93;">Доцент каф. ИТ • лаб. 3/118</div>
          </div>
          <span style="color:var(--accent-blue); font-size:9.5px;">Расписание ›</span>
        </div>

        <div class="section-tag">Свободные кабинеты сейчас (10:00)</div>
        <div class="dir-item">
          <div>
            <span style="color:#30D158; font-weight:700;">● 3/211</span>
            <span style="color:#8E8E93; font-size:8px; margin-left:3px;">до 14:05 • 3 корп.</span>
          </div>
          <span class="room-status-pill status-free">СВОБОДНА</span>
        </div>
        <div class="dir-item">
          <div>
            <span style="color:#FF453A; font-weight:700;">● 332</span>
            <span style="color:#8E8E93; font-size:8px; margin-left:3px;">Лекция Санников И.А.</span>
          </div>
          <span class="room-status-pill status-busy">ЗАНЯТА</span>
        </div>
      </div>
      <div class="home-indicator"></div>
    </div>
  </div>

  <!-- PHONE 6: SETTINGS SCREEN -->
  <div class="phone-wrapper">
    <div class="phone-label">
      <span>6️⃣</span> 6. SettingsScreen (Настройки)
    </div>
    <div class="phone-frame">
      <div class="status-bar">
        <span class="time-text">9:41</span>
        <div class="dynamic-island"><div class="island-cam"></div></div>
        <div class="status-icons"><span>5G</span><span>100%</span></div>
      </div>
      <div class="screen-body">
        <div class="app-header">
          <div class="app-small-title">НАСТРОЙКИ</div>
          <div class="app-large-title">Параметры</div>
        </div>

        <div class="section-tag">Оформление</div>
        <div class="settings-group">
          <div class="settings-row">
            <span>Тема интерфейса</span>
            <div class="segmented-control" style="width:110px;">
              <div class="seg-btn active">OLED</div>
              <div class="seg-btn">Charcoal</div>
            </div>
          </div>
          <div class="settings-row">
            <span>Акцентный цвет</span>
            <span style="color:#0A84FF; font-weight:700;">● Сапфир</span>
          </div>
        </div>

        <div class="section-tag">Расписание</div>
        <div class="settings-group">
          <div class="settings-row">
            <span>Подгруппа по умолч.</span>
            <div class="segmented-control" style="width:90px;">
              <div class="seg-btn">Все</div>
              <div class="seg-btn active">1п</div>
              <div class="seg-btn">2п</div>
            </div>
          </div>
          <div class="settings-row">
            <span>Авто-четность недели</span>
            <div class="toggle-switch"><div class="toggle-knob"></div></div>
          </div>
        </div>

        <div class="section-tag">Уведомления</div>
        <div class="settings-group">
          <div class="settings-row">
            <span>Напоминать за 15 мин</span>
            <div class="toggle-switch"><div class="toggle-knob"></div></div>
          </div>
          <div class="settings-row">
            <span>Звуковой сигнал</span>
            <span style="color:#8E8E93;">Тритон ›</span>
          </div>
        </div>

        <div class="section-tag">Система</div>
        <div class="settings-group">
          <div class="settings-row">
            <span>Офлайн-кэш</span>
            <span style="color:#30D158; font-weight:700;">● Активен (42 КБ)</span>
          </div>
          <div class="settings-row">
            <span style="color:#8E8E93;">Версия приложения</span>
            <span style="color:#fff; font-weight:600;">v1.3.0</span>
          </div>
        </div>
      </div>
      <div class="home-indicator"></div>
    </div>
  </div>

</div>

<script>
  function switchTheme(theme) {
    document.querySelectorAll('.phone-frame').forEach(f => {
      if (theme === 'light') {
        f.style.background = '#F2F2F7';
        f.style.color = '#000';
      } else {
        f.style.background = '#000000';
        f.style.color = '#fff';
      }
    });
  }

  function toggleSim() {
    const card = document.getElementById('liveCard');
    if (card) {
      card.classList.toggle('live');
    }
  }
</script>
</body>
</html>
"""

with open('mockups/t3_screens_showcase.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Regenerated mockups/t3_screens_showcase.html successfully!")
