import json

with open('mockups/t3_screens_showcase.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's write a python script to test calling preview
print(f"HTML size: {len(html)} bytes")
