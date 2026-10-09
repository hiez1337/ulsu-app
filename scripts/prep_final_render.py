import json

with open('mockups/t3_screens_showcase.min.html', 'r', encoding='utf-8') as f:
    html = f.read()

escaped = json.dumps(html)

js_code = f"""const html = {escaped};
const preview = await tools["t3-code-75dfb82c-8301-414a-96c7-78c6eb493195"].html_preview({{
  html,
  width: 728
}});

const h = Math.min(Math.max(preview.contentHeight || 1160, 80), 2000);

const render = await tools["t3-code-75dfb82c-8301-414a-96c7-78c6eb493195"].html_render({{
  html,
  title: "ULSU Schedule App 6 Screens Showcase",
  height: h
}});

return {{ contentHeight: preview.contentHeight, render }};
"""

with open('call_render_final.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("call_render_final.js generated successfully!")
