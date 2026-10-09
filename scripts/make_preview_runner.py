with open('mockups/t3_screens_showcase.html', 'r', encoding='utf-8') as f:
    html = f.read()

import json
escaped_html = json.dumps(html)

js_code = f"""
const htmlContent = {escaped_html};
const previewRes = await tools["t3-code-75dfb82c-8301-414a-96c7-78c6eb493195"].html_preview({{
  html: htmlContent,
  width: 728
}});
return previewRes;
"""

with open('preview_runner.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("Generated preview_runner.js successfully!")
