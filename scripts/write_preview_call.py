import json

with open('mockups/t3_screens_showcase.html', 'r', encoding='utf-8') as f:
    html = f.read()

escaped = json.dumps(html)

js_preview = f"""const html = {escaped};
const preview = await tools["t3-code-75dfb82c-8301-414a-96c7-78c6eb493195"].html_preview({{
  html,
  width: 728
}});
return preview;
"""

with open('call_preview.js', 'w', encoding='utf-8') as f:
    f.write(js_preview)

print("call_preview.js written!")
