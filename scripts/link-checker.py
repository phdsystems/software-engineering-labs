#!/usr/bin/env python3
"""
Markdown Link Checker
Detects broken internal links in markdown files
"""
import re
from pathlib import Path
from collections import Counter, defaultdict

def find_broken_links(doc_root, verbose=False):
    """Find all broken markdown links in documentation."""
    broken_links = []
    total_links = 0
    total_files = 0
    
    # Find all markdown files, excluding node_modules
    md_files = [f for f in Path(doc_root).rglob("*.md") 
                if 'node_modules' not in str(f)]
    
    for md_file in md_files:
        total_files += 1
        try:
            content = md_file.read_text(encoding='utf-8')
            
            # Find all markdown links: [text](path)
            links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
            
            for link_text, link_path in links:
                # Skip external links, anchors, data URIs, mailto
                if link_path.startswith(('http://', 'https://', '#', 'data:', 'mailto:')):
                    continue
                
                # Skip empty or placeholder links
                if not link_path or link_path == 'path':
                    continue
                
                total_links += 1
                
                # Remove anchor from path (e.g., file.md#section)
                clean_path = link_path.split('#')[0]
                if not clean_path:
                    continue
                
                # Resolve the path relative to the markdown file
                if clean_path.startswith('/'):
                    # Absolute path from repo root
                    target_path = Path(doc_root).parent / clean_path.lstrip('/')
                else:
                    # Relative path
                    target_path = (md_file.parent / clean_path).resolve()
                
                # Check if target exists
                if not target_path.exists():
                    broken_links.append({
                        'file': str(md_file.relative_to(doc_root)),
                        'link_text': link_text,
                        'link_path': link_path,
                        'resolved_path': str(target_path),
                        'line': None  # Could add line number tracking
                    })
                    
                    if verbose:
                        print(f"✗ {md_file.name}: [{link_text}]({link_path})")
                        
        except Exception as e:
            print(f"Error processing {md_file}: {e}")
    
    return broken_links, total_links, total_files

def print_summary(doc_root):
    """Print a summary report of link validation."""
    broken, total, files = find_broken_links(doc_root)
    
    print("=" * 70)
    print("MARKDOWN LINK VALIDATION REPORT")
    print("=" * 70)
    print(f"\n📊 Statistics:")
    print(f"  Files scanned:        {files}")
    print(f"  Total internal links: {total}")
    print(f"  Broken links:         {len(broken)}")
    print(f"  Valid links:          {total - len(broken)}")
    print(f"  Success rate:         {((total - len(broken)) / total * 100):.1f}%")
    
    if len(broken) > 0:
        # Group by file
        by_file = defaultdict(list)
        for item in broken:
            by_file[item['file']].append(item)
        
        print(f"\n🗂️  Files with broken links: {len(by_file)}")
        
        # Show files with most broken links
        print(f"\n📁 Top 10 files with most broken links:")
        file_counts = Counter(item['file'] for item in broken)
        for file, count in file_counts.most_common(10):
            print(f"  {count:3d}x  {file}")
        
        # Show most common broken link patterns
        print(f"\n🔗 Top 15 most common broken link patterns:")
        link_counts = Counter(item['link_path'] for item in broken)
        for link, count in link_counts.most_common(15):
            print(f"  {count:3d}x  {link}")
            
        # Show detailed breakdown for first few files
        print(f"\n📝 Detailed breakdown (first 5 files):")
        for file, items in sorted(by_file.items())[:5]:
            print(f"\n  {file}:")
            for item in items[:5]:  # Show first 5 links per file
                print(f"    [{item['link_text']}]({item['link_path']})")
            if len(items) > 5:
                print(f"    ... and {len(items) - 5} more")
    else:
        print("\n✅ All links are valid!")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    import sys
    doc_root = sys.argv[1] if len(sys.argv) > 1 else "."
    print_summary(Path(doc_root))
