import re
import os

def remove_logs_and_comments(file_path):
    """Remove debug, info, warn logs and comments from TypeScript files"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Remove single-line comments (// ...)
    # But keep URLs like https://
    content = re.sub(r'(?<!:)//(?!/)[^\n]*', '', content)
    
    # Remove multi-line comments (/* ... */)
    content = re.sub(r'/\*[\s\S]*?\*/', '', content, flags=re.MULTILINE)
    
    # Remove this.logger.debug(...) calls
    content = re.sub(r'\s*this\.logger\.debug\([^)]*\);?\s*\n?', '\n', content, flags=re.MULTILINE)
    content = re.sub(r'\s*this\.logger\.debug\(\s*`[^`]*`,?\s*\);?\s*\n?', '\n', content, flags=re.MULTILINE)
    
    # Remove this.logger.info(...) calls
    content = re.sub(r'\s*this\.logger\.info\([^)]*\);?\s*\n?', '\n', content, flags=re.MULTILINE)
    
    # Remove this.logger.warn(...) calls
    content = re.sub(r'\s*this\.logger\.warn\([^)]*\);?\s*\n?', '\n', content, flags=re.MULTILINE)
    
    # Remove multiline logger calls
    lines = content.split('\n')
    cleaned_lines = []
    skip_until_semicolon = False
    logger_pattern = re.compile(r'^\s*this\.logger\.(debug|info|warn)\(')
    
    for line in lines:
        if logger_pattern.match(line):
            skip_until_semicolon = True
        
        if skip_until_semicolon:
            if ';' in line:
                skip_until_semicolon = False
            continue
        
        cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines)
    
    # Remove excessive empty lines (more than 2 consecutive)
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    # Write back
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Cleaned: {file_path}")
        return True
    else:
        print(f"⏭️  No changes: {file_path}")
        return False

# Process files
files_to_clean = [
    r'd:\c_p\aziz_bot_grammy\src\modules\channel\services\channel-status.service.ts',
    r'd:\c_p\aziz_bot_grammy\src\modules\user\user.handler.ts',
]

changed_count = 0
for file_path in files_to_clean:
    if os.path.exists(file_path):
        if remove_logs_and_comments(file_path):
            changed_count += 1
    else:
        print(f"❌ Not found: {file_path}")

print(f"\n✨ Done! Changed {changed_count} file(s)")
