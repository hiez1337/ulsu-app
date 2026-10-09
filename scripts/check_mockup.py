import re

with open('mockups/design_concepts.html', 'r', encoding='utf-8') as f:
    html = f.read()

print('Length of html:', len(html))
funcs = set(re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', html))
print('Functions defined:', sorted(list(funcs)))

onclick_calls = re.findall(r'onclick=[\'"]([^\'"]+)[\'"]', html)
called_funcs = set()
for oc in onclick_calls:
    m = re.match(r'([a-zA-Z0-9_]+)\s*\(', oc.strip())
    if m:
        called_funcs.add(m.group(1))

missing = called_funcs - funcs
print('Missing functions called in onclick:', missing)

# Check elements accessed by getElementById
get_ids = set(re.findall(r'document\.getElementById\([\'"]([^\'"]+)[\'"]\)', html))
all_ids = set(re.findall(r'id=[\'"]([^\'"]+)[\'"]', html))
missing_ids = get_ids - all_ids
print('Missing element IDs accessed in JS:', missing_ids)
