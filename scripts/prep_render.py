import json

with open('mockups/t3_screens_showcase.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's inspect size
print(f"Size: {len(html)}")

# Create the execute script
escaped = json.dumps(html)
js_script = f"""const html = {escaped};
const preview = await tools["t3-code-75dfb82c-8301-414a-96c7-78c6eb493195"].html_preview({{
  html,
  width: 728
}});

const render = await tools["t3-code-75dfb82c-8301-414a-96c7-78c6eb493195"].html_render({{
  html,
  title: "ULSU Mobile App 6-Screen Showcase",
  height: preview.contentHeight || 1150
}});

return {{ preview, render }};
"""

with open('run_render.js', 'w', encoding='utf-8') as f:
    f.write(js_script)

print("run_render.js ready!")
