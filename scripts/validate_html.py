from html.parser import HTMLParser

class TagChecker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.void_tags = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() not in self.void_tags:
            self.stack.append((tag.lower(), self.getpos()))

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in self.void_tags:
            return
        if not self.stack:
            self.errors.append(f"Unexpected closing tag </{tag}> at line {self.getpos()[0]}")
            return
        last_tag, pos = self.stack.pop()
        if last_tag != tag_lower:
            self.errors.append(f"Mismatched tag: expected </{last_tag}> (from line {pos[0]}), got </{tag}> at line {self.getpos()[0]}")

with open('mockups/t3_screens_showcase.html', 'r', encoding='utf-8') as f:
    content = f.read()

checker = TagChecker()
checker.feed(content)

print(f"Total unclosed tags: {len(checker.stack)}")
for t, pos in checker.stack:
    print(f"  Unclosed <{t}> from line {pos[0]}")
print(f"Tag mismatch errors: {len(checker.errors)}")
for err in checker.errors[:10]:
    print(f"  {err}")

if not checker.stack and not checker.errors:
    print("HTML is 100% syntactically valid!")
