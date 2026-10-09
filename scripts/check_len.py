import json

with open('call_render_final.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's inspect
print(f"Code characters: {len(code)}")
