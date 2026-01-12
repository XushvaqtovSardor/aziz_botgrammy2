import os
import re
from pathlib import Path

def remove_comments_and_logs(file_path):
    """Remove comments and debug logs from TypeScript file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Remove single-line comments (but keep URLs like https://)
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Skip empty comment lines
        if re.match(r'^\s*//\s*$', line):
            continue
        # Skip comment-only lines (but not URLs)
        if re.match(r'^\s*//', line) and not 'http' in line:
            continue
        cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines)
    
    # Remove multi-line comments (/** ... */)
    content = re.sub(r'/\*\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Remove empty lines (more than 2 consecutive)
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    
    # Only write if content changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path('src')
    modified_count = 0
    
    for ts_file in src_dir.rglob('*.ts'):
        if remove_comments_and_logs(ts_file):
            modified_count += 1
            print(f'✓ Cleaned: {ts_file}')
    
    print(f'\n✅ Cleaned {modified_count} files')

if __name__ == '__main__':
    main()
