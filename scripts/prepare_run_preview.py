import json

with open('mockups/t3_screens_showcase.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's compress or optimize slightly so it is compact and fits easily
html_str = json.dumps(html)

js = f"""
const htmlDoc = {html_str};
const res = await tools["t3-code-75dfb82c-8301-414a-96c7-78c6eb493195"].html_preview({{
  html: htmlDoc,
  width: 728
}});
return res;
"""

with open('scripts/run_preview.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("run_preview.js ready")
