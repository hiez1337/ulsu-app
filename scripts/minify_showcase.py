import re, json

with open('mockups/t3_screens_showcase.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Minify CSS and HTML slightly
html_clean = re.sub(r'\s+', ' ', html)
html_clean = re.sub(r'>\s+<', '><', html_clean)
print(f"Original: {len(html)}, Minified: {len(html_clean)}")

with open('mockups/t3_screens_showcase.min.html', 'w', encoding='utf-8') as f:
    f.write(html_clean)

escaped = json.dumps(html_clean)
js_code = f"""const html = {escaped};
const preview = await tools["t3-code-75dfb82c-8301-414a-96c7-78c6eb493195"].html_preview({{
  html,
  width: 728
}});
return preview;
"""

with open('call_preview_min.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("call_preview_min.js ready, length:", len(js_code))
