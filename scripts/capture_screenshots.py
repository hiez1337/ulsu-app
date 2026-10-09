import asyncio
import json
import os
import subprocess
import tempfile
import time
import urllib.request
import websockets
import base64
import sys

sys.stdout.reconfigure(line_buffering=True)

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE_PATH):
    EDGE_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

URL = "http://localhost:8081"
OUTPUT_DIR = os.path.abspath("assets/screenshots")
os.makedirs(OUTPUT_DIR, exist_ok=True)

class CDPClient:
    def __init__(self, ws):
        self.ws = ws
        self.msg_id = 1

    async def call(self, method, params=None):
        mid = self.msg_id
        self.msg_id += 1
        payload = {"id": mid, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(payload))
        while True:
            raw = await self.ws.recv()
            resp = json.loads(raw)
            if resp.get("id") == mid:
                if "error" in resp:
                    raise Exception(f"CDP error: {resp['error']}")
                return resp.get("result", {})

    async def eval_js(self, expression):
        res = await self.call("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        return res.get("result", {}).get("value")

    async def capture_screenshot(self, filename):
        res = await self.call("Page.captureScreenshot", {"format": "png"})
        data = base64.b64decode(res["data"])
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(data)
        print(f"Captured {filename} ({len(data)} bytes)", flush=True)
        return filepath

async def main():
    user_data_dir = tempfile.mkdtemp(prefix="edge_cdp_")
    cmd = [
        EDGE_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        "--remote-debugging-port=9222",
        f"--user-data-dir={user_data_dir}",
        "--window-size=393,852",
        "--force-device-scale-factor=2",
        "about:blank"
    ]
    
    print(f"Launching Edge with user_data_dir: {user_data_dir}...", flush=True)
    proc = subprocess.Popen(cmd)
    
    # Wait for debugging port to be ready
    ws_url = None
    for attempt in range(15):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=2) as resp:
                targets = json.loads(resp.read().decode())
                pages = [t for t in targets if t.get("type") == "page"]
                if pages:
                    ws_url = pages[0]["webSocketDebuggerUrl"]
                    break
        except Exception:
            pass

    if not ws_url:
        proc.kill()
        raise RuntimeError("Failed to obtain webSocketDebuggerUrl from Edge")

    print(f"Connecting to CDP at {ws_url}...", flush=True)
    try:
        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            cdp = CDPClient(ws)
            await cdp.call("Page.enable")
            await cdp.call("Runtime.enable")
            await cdp.call("Emulation.setDeviceMetricsOverride", {
                "width": 393,
                "height": 852,
                "deviceScaleFactor": 2,
                "mobile": True
            })

            # Navigate to localhost:8081
            print("Navigating to http://localhost:8081...", flush=True)
            await cdp.call("Page.navigate", {"url": URL})
            await asyncio.sleep(2.5)

            # --- SCREEN 1: Group Selection ---
            print("Preparing Screen 1: Group Selection...", flush=True)
            await cdp.eval_js("localStorage.clear();")
            await cdp.call("Page.reload")
            await asyncio.sleep(2)
            await cdp.capture_screenshot("1_group_selection.png")

            # --- SCREEN 2: Schedule Day ---
            print("Preparing Screen 2: Schedule Day...", flush=True)
            # Click "Открыть расписание"
            await cdp.eval_js("""(() => {
                const btn = Array.from(document.querySelectorAll('*')).find(e => e.textContent === 'Открыть расписание');
                if (btn) {
                    const target = btn.closest('[role="button"]') || btn.parentElement || btn;
                    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
            })()""")
            await asyncio.sleep(2)
            await cdp.capture_screenshot("2_schedule_day.png")

            # --- SCREEN 3: Lesson Detail Sheet ---
            print("Preparing Screen 3: Lesson Detail...", flush=True)
            await cdp.eval_js("""(() => {
                const el = document.evaluate("//div[contains(text(), 'ауд.')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (el) {
                    let p = el;
                    while (p && !p.className.includes('r-1loqt21')) { p = p.parentElement; }
                    const target = p || el;
                    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
            })()""")
            await asyncio.sleep(1.5)

            # Add a task to make the screenshot look realistic and informative
            await cdp.eval_js("""(() => {
                const input = document.querySelector('input[placeholder*="Добавить задание"]');
                if (input) {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeInputValueSetter.call(input, 'Подготовить отчет к лабораторной №1');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    const btn = input.parentElement.querySelector('div:last-child');
                    if (btn) btn.click();
                }
            })()""")
            await asyncio.sleep(0.8)
            await cdp.capture_screenshot("3_lesson_detail.png")

            # Close sheet
            print("Closing lesson detail sheet...", flush=True)
            await cdp.eval_js("""(() => {
                const closeBtn = Array.from(document.querySelectorAll('div')).find(d => {
                    const s = window.getComputedStyle(d);
                    return (s.borderRadius === '18px' || s.width === '36px') && (d.textContent.includes('') || d.textContent.includes('✕') || d.textContent.length === 1);
                });
                if (closeBtn) closeBtn.click();
            })()""")
            await asyncio.sleep(1)

            # --- SCREEN 4: Weekly Grid ---
            print("Preparing Screen 4: Weekly Grid...", flush=True)
            await cdp.eval_js("""(() => {
                const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
                const tab = tabs.find(t => t.textContent.includes('Неделя'));
                if (tab) tab.click();
            })()""")
            await asyncio.sleep(1.5)
            await cdp.capture_screenshot("4_weekly_grid.png")

            # --- SCREEN 5: Search & Free Rooms ---
            print("Preparing Screen 5: Search & Rooms...", flush=True)
            await cdp.eval_js("""(() => {
                const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
                const tab = tabs.find(t => t.textContent.includes('Поиск'));
                if (tab) tab.click();
            })()""")
            await asyncio.sleep(1.5)
            await cdp.capture_screenshot("5_search_rooms.png")

            # --- SCREEN 6: Settings ---
            print("Preparing Screen 6: Settings...", flush=True)
            await cdp.eval_js("""(() => {
                const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
                const tab = tabs.find(t => t.textContent.includes('Настройки'));
                if (tab) tab.click();
            })()""")
            await asyncio.sleep(1.5)
            await cdp.capture_screenshot("6_settings.png")

            print("All 6 screenshots successfully captured and stored in assets/screenshots/!", flush=True)

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
