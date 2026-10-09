import re

with open('mockups/t3_screens_showcase.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make the outer container styled for dark theme by default
html = html.replace(
    "background: transparent;",
    "background: #0B0D13; color: #FFFFFF;"
)

# Fix phone frame height and inner overflow
html = html.replace("height: 468px;", "height: 490px;")
html = html.replace("max-width: 226px;", "max-width: 236px;")
html = html.replace("padding: 42px 10px 18px 10px;", "padding: 40px 11px 22px 11px;")

# Save updated HTML
with open('mockups/t3_screens_showcase.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated t3_screens_showcase.html with dark theme background!")
