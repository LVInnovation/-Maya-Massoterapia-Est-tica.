from pathlib import Path

files = [Path('src/pages/Agenda.tsx'), Path('src/pages/Admin.tsx')]
replacements = [
    ('bg-gray-50', 'bg-dark-800'),
    ('bg-gray-100', 'bg-dark-700'),
    ('bg-gray-200', 'bg-dark-700'),
    ('bg-gray-300', 'bg-dark-700'),
    ('bg-gray-400', 'bg-dark-700'),
    ('bg-gray-500', 'bg-dark-700'),
    ('bg-white', 'bg-dark-700'),
    ('bg-pink-50', 'bg-gold-400/10'),
    ('bg-pink-100', 'bg-gold-400/15'),
    ('bg-pink-200', 'bg-gold-400/20'),
    ('bg-pink-500', 'bg-gold-400'),
    ('text-pink-500', 'text-gold-300'),
    ('text-pink-600', 'text-gold-300'),
    ('text-pink-700', 'text-gold-300'),
    ('border-pink-100', 'border-gold-400/20'),
    ('border-pink-200', 'border-gold-400/20'),
    ('border-pink-500', 'border-gold-400'),
    ('hover:bg-pink-100', 'hover:bg-gold-300'),
    ('hover:bg-pink-600', 'hover:bg-gold-300'),
    ('text-gray-900', 'text-gray-100'),
    ('text-gray-800', 'text-gray-100'),
    ('text-gray-700', 'text-gray-200'),
    ('text-gray-600', 'text-gray-300'),
    ('text-gray-500', 'text-gray-400'),
    ('text-gray-400', 'text-gray-300'),
    ('border-gray-200', 'border-gold-400/20'),
    ('border-gray-100', 'border-gold-400/10'),
    ('border-gray-300', 'border-gold-400/20'),
    ('border-gray-400', 'border-gold-400/20'),
    ('hover:bg-gray-50', 'hover:bg-dark-600'),
    ('hover:bg-gray-100', 'hover:bg-dark-600'),
    ('hover:bg-gray-200', 'hover:bg-dark-600'),
    ('bg-red-50', 'bg-red-950/40'),
    ('text-red-700', 'text-red-400'),
    ('border-red-100', 'border-red-400/30'),
    ('bg-green-50', 'bg-green-950/30'),
    ('text-green-700', 'text-green-300'),
    ('border-green-100', 'border-green-300/40'),
    ('bg-yellow-50', 'bg-yellow-950/20'),
    ('text-yellow-700', 'text-gold-300'),
    ('border-yellow-100', 'border-gold-400/20'),
]

for file in files:
    path = Path(file)
    text = path.read_text(encoding='utf-8')
    orig = text
    for old, new in replacements:
        text = text.replace(old, new)
    if text != orig:
        path.write_text(text, encoding='utf-8')
        print(f'Updated {path}')
    else:
        print(f'No changes for {path}')

index = Path('src/index.css')
css = index.read_text(encoding='utf-8')
extra = '''
/* Premium gold accent overrides */
.text-pink-500,
.text-pink-600,
.text-pink-700 {
  color: #d4af37 !important;
}
.text-red-700 {
  color: #ff9999 !important;
}
.text-green-700 {
  color: #90e090 !important;
}
.border-pink-100,
.border-pink-200,
.border-pink-500 {
  border-color: rgba(212, 175, 55, 0.25) !important;
}
.hover\:bg-pink-600:hover {
  background-color: #d4af37 !important;
}
'''
if extra not in css:
    index.write_text(css + '\n' + extra, encoding='utf-8')
    print('Updated index.css with premium overrides')
else:
    print('index.css already has overrides')
