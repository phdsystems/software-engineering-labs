# Link Checker Tool

**Purpose:** Validate internal markdown links in documentation
**Location:** `scripts/link-checker.py`
**Language:** Python 3 (standard library only, no dependencies)

---

## Quick Start

```bash
# Check all documentation
python3 scripts/link-checker.py doc/

# Check specific directory
python3 scripts/link-checker.py doc/software-engineering/

# Make it executable
chmod +x scripts/link-checker.py
./scripts/link-checker.py doc/
```

---

## What It Does

The link checker:

1. **Scans** all markdown files (`.md`) in the specified directory
2. **Extracts** internal links using regex pattern `[text](path)`
3. **Skips** external links (http://, https://), anchors (#), data URIs, mailto links
4. **Resolves** relative and absolute paths
5. **Validates** that target files exist
6. **Reports** broken links with detailed statistics

---

## Output

The tool provides:

### Statistics
- Total files scanned
- Total internal links found
- Number of broken links
- Success rate percentage

### Analysis
- **Top broken link patterns** - Identify systematic issues
- **Files with most broken links** - Prioritize which files to fix
- **Detailed breakdown** - Specific broken links per file

### Example Output

```
======================================================================
MARKDOWN LINK VALIDATION REPORT
======================================================================

📊 Statistics:
  Files scanned:        76
  Total internal links: 657
  Broken links:         12
  Valid links:          645
  Success rate:         98.2%

🔗 Top 15 most common broken link patterns:
   4x  ../missing-file.md
   3x  overview.md
   2x  example/README.md
   ...
```

---

## How It Works

### 1. Link Detection
```python
links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
```
Finds all markdown links in format `[text](path)`

### 2. Filtering
```python
if link_path.startswith(('http://', 'https://', '#', 'data:', 'mailto:')):
    continue
```
Only checks internal file links

### 3. Path Resolution
```python
# Relative paths: ../file.md
target_path = (md_file.parent / clean_path).resolve()

# Absolute paths: /doc/file.md
target_path = Path(doc_root).parent / clean_path.lstrip('/')
```

### 4. Validation
```python
if not target_path.exists():
    broken_links.append(...)
```

---

## Use Cases

### Before Committing
```bash
# Check if you broke any links
python3 scripts/link-checker.py doc/
```

### After Refactoring
```bash
# Verify all links still work after moving files
python3 scripts/link-checker.py doc/
```

### Finding Patterns
```bash
# Identify systematic issues (e.g., wrong path prefix)
python3 scripts/link-checker.py doc/ | grep "Top.*patterns"
```

### CI/CD Integration
```bash
# Exit with error if broken links found
python3 scripts/link-checker.py doc/ && echo "✓ All links valid" || exit 1
```

---

## Interpreting Results

### Common Patterns

**Self-referencing files:**
```
18x  overview.md
```
Files in the same directory referencing each other - may be intentional

**Missing files:**
```
4x  deep-dive-hexagonal.md
```
Referenced file doesn't exist - create it or remove references

**Wrong paths:**
```
25x  ../../patterns/file.md
```
Systematic path error - use `sed` to fix all at once:
```bash
find . -name "*.md" -exec sed -i 's|](../../patterns/|](../../architecture-pattern/|g' {} +
```

**Placeholders:**
```
12x  README.md
```
Placeholder links that need to be updated

---

## Fixing Broken Links

### Strategy 1: Fix Individual Files
Edit the file and update the broken link manually.

### Strategy 2: Batch Fix with sed
For systematic issues, use `sed`:

```bash
# Fix all instances of wrong path
find doc/ -name "*.md" -exec sed -i 's|](old-path/|](new-path/|g' {} +

# Remove broken reference lines entirely
find doc/ -name "*.md" -exec sed -i '/broken-file.md/d' {} +
```

### Strategy 3: Create Missing Files
If many files reference a missing file, create it:
```bash
touch doc/path/to/missing-file.md
```

---

## Integration with Git

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Checking markdown links..."
python3 scripts/link-checker.py doc/
if [ $? -ne 0 ]; then
    echo "❌ Broken links found. Commit aborted."
    exit 1
fi
```

### Git Alias
Add to `.gitconfig`:
```ini
[alias]
    check-links = !python3 scripts/link-checker.py doc/
```

Usage: `git check-links`

---

## Limitations

**What it checks:**
- ✅ Internal markdown links to files
- ✅ Relative paths (`../file.md`)
- ✅ Absolute paths (`/doc/file.md`)

**What it doesn't check:**
- ❌ External links (http://, https://)
- ❌ Anchor validity (e.g., `#section` exists in target file)
- ❌ Image paths (separate tool needed)
- ❌ Link reachability (HTTP status codes)

---

## Extending the Tool

### Add Line Numbers
Track which line each link appears on:
```python
for i, line in enumerate(content.split('\n'), 1):
    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', line)
    for text, path in links:
        broken_links.append({'line': i, ...})
```

### Check Anchor Validity
Verify that `file.md#section` has a matching heading:
```python
anchor = link_path.split('#')[1] if '#' in link_path else None
if anchor:
    target_content = target_path.read_text()
    heading = f"## {anchor}" or f"# {anchor}"
    if heading not in target_content:
        broken_links.append(...)
```

### Export to JSON
```python
import json
with open('broken-links.json', 'w') as f:
    json.dump(broken_links, f, indent=2)
```

---

## Troubleshooting

### "No such file or directory"
- Check that you're running from repository root
- Verify the path argument is correct

### "Permission denied"
```bash
chmod +x scripts/link-checker.py
```

### False Positives
Some links may be flagged but are actually valid:
- Links to files that will be generated later
- Links to external resources mounted at runtime
- Template placeholders

Add exceptions in the script:
```python
IGNORE_PATTERNS = ['generated/', 'template-']
if any(pattern in link_path for pattern in IGNORE_PATTERNS):
    continue
```

---

## Maintenance

### When to Run
- ✅ Before committing documentation changes
- ✅ After refactoring/moving files
- ✅ Weekly in CI/CD
- ✅ Before releases

### Keeping It Up to Date
The tool uses Python standard library only, so no dependency updates needed. Review the regex pattern if markdown syntax changes.

---

## Alternative Tools

If this tool doesn't meet your needs, consider:

- **markdown-link-check** (Node.js) - Checks external links too
- **linkchecker** (Python package) - Full website link validation
- **awesome_bot** (Ruby) - README link checker
- **lychee** (Rust) - Fast link checker with async support

---

**Last Updated:** 2025-11-06
**Version:** 1.0
**Requires:** Python 3.6+
