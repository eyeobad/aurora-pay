# coding: utf-8
from pathlib import Path
path = Path('src/screens/LoginScreen.tsx')
text = path.read_text(encoding='utf-8')
target = 'placeholder="\u5c01\u5c01\u5c01\u5c01"'
replacement = 'placeholder="••••••••"'
if target not in text:
    raise SystemExit('target not found')
text = text.replace(target, replacement, 1)
path.write_text(text, encoding='utf-8')
