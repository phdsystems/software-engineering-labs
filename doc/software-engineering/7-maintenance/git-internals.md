# How Git Detects File Changes and Deletions

**Purpose:** Deep dive into Git's change detection mechanism
**Audience:** Developers wanting to understand Git internals
**Date:** 2025-10-20
**Version:** 1.0

---

## TL;DR

**Git doesn't watch files in real-time.** Instead, it uses a **snapshot-based comparison system** with three storage areas: Working Directory (your files), Staging Area/Index (planned snapshot stored in `.git/index`), and Repository (committed history in `.git/objects/`). When you run `git status`, Git reads the index (list of tracked files with metadata), scans your filesystem, and **compares the two lists**. **Files in index but not on disk → deleted**. Files on disk but not in index → untracked. Different modification time or content hash → modified. This is efficient because Git only stores metadata (path, size, mtime, SHA-1 hash), not full file contents, and uses fast filesystem stat() calls instead of content comparison.

---

## Table of Contents

1. [The Three Storage Areas](#the-three-storage-areas)
2. [Git's Index (Staging Area)](#gits-index-staging-area)
3. [The Detection Algorithm](#the-detection-algorithm)
4. [Index File Structure](#index-file-structure)
5. [Why This is Efficient](#why-this-is-efficient)
6. [The Comparison Process](#the-comparison-process)
7. [Real Git Commands](#real-git-commands)
8. [Practical Example](#practical-example)
9. [Summary](#summary)
10. [References](#references)

---

## The Three Storage Areas

Git uses three distinct storage areas to track changes:

```
┌─────────────────────────────────────────────────────┐
│           Git's Three Storage Areas                  │
└─────────────────────────────────────────────────────┘

1. WORKING DIRECTORY          2. STAGING AREA (INDEX)      3. REPOSITORY
   (Your actual files)           (Planned snapshot)          (Committed history)

   /home/developer/            .git/index                   .git/objects/
   project/                    (binary file)                (commits, trees, blobs)
   └── doc/
       ├── overview.md         [tracked files list]         commit abc123
       └── template/           - doc/overview.md            ├── doc/overview.md
           └── README.md       - doc/template/README.md     ├── doc/template/README.md
                               - doc/template/guide/...     └── (snapshot)
```

### 1. Working Directory

- **What it is:** Your actual filesystem with real files
- **Location:** The project directory you see and edit
- **Changes:** Instant when you create/modify/delete files

### 2. Staging Area (Index)

- **What it is:** Git's database of tracked files and their metadata
- **Location:** `.git/index` (binary file)
- **Purpose:** Snapshot of what will go into the next commit
- **Changes:** Only when you run `git add` or `git rm`

### 3. Repository

- **What it is:** Permanent history of commits
- **Location:** `.git/objects/` (compressed objects)
- **Purpose:** Store complete project history
- **Changes:** Only when you run `git commit`

---

## Git's Index (Staging Area)

The index is a **binary file** located at `.git/index` that contains a list of all tracked files.

### What's Stored in the Index

For each tracked file, Git stores:

| Field | Purpose | Example |
|-------|---------|---------|
| **Path** | File location | `doc/template/README.md` |
| **Mode** | File permissions | `100644` (regular file) |
| **SHA-1** | Content hash | `a3f5e7b2...` (40 chars) |
| **Size** | File size in bytes | `3819` |
| **mtime** | Modification timestamp | `1729450740` |
| **ctime** | Creation timestamp | `1729450740` |
| **Stage** | Merge conflict stage | `0` (normal) |

### Inspecting the Index

```bash
# View index file metadata
file .git/index
# Output: Git index, version 2, 164 entries

# See index file size
ls -lh .git/index
# Output: -rw-r--r-- 1 user user 18K Oct 20 19:58 .git/index

# List all tracked files with metadata
git ls-files --stage
# Output:
# 100644 79dcede75b8d9679d629c4eac568aeaee46683b3 0	.gitignore
# 100644 bebc2e6c72d2390eba83f2d53b8f07c211443847 0	Makefile
# 100644 a448185571ab4dcb1cd95e7a435a7f0923cb05a9 0	README.md

# List just the filenames
git ls-files
# Output:
# .gitignore
# Makefile
# README.md
```

### Understanding the Output Format

```
100644 79dcede... 0 .gitignore
│      │          │ │
│      │          │ └─ Filename
│      │          └─── Stage number (0 = normal, 1-3 = merge conflicts)
│      └──────────────  SHA-1 hash of file contents
└──────────────────────  File mode (100644 = regular file, 100755 = executable)
```

---

## The Detection Algorithm

When you run `git status`, Git executes this algorithm:

### Pseudo-Code

```python
def git_status():
    """
    Simplified pseudo-code of how Git detects changes
    """
    # Step 1: Read the index (list of tracked files)
    tracked_files = read_git_index()  # From .git/index
    # Example: {
    #   'doc/template/README.md': {
    #       'size': 3819,
    #       'mtime': 1729450740,
    #       'sha1': 'def456'
    #   },
    #   'doc/overview.md': {...}
    # }

    # Step 2: Scan the working directory
    actual_files = scan_filesystem()  # Walk the directory tree
    # Example: {
    #   'doc/overview.md': {
    #       'size': 17465,
    #       'mtime': 1729350000
    #   }
    #   # Note: template files are gone!
    # }

    # Step 3: Compare the two lists
    for file_path, metadata in tracked_files.items():
        if file_path not in actual_files:
            # File was deleted from filesystem
            print(f"deleted: {file_path}")

        elif actual_files[file_path]['mtime'] != metadata['mtime']:
            # Modification time changed, need to check content
            if compute_sha1(file_path) != metadata['sha1']:
                print(f"modified: {file_path}")

        # If mtime and size match, assume unchanged (optimization)

    # Step 4: Check for untracked files
    for file_path in actual_files:
        if file_path not in tracked_files:
            print(f"untracked: {file_path}")
```

### Python Demonstration

```python
#!/usr/bin/env python3
"""
Simplified demonstration of how Git detects changes
"""

# Simulated Git index (what was committed)
git_index = {
    'doc/overview.md': {
        'size': 17465,
        'mtime': 1729350000,
        'sha1': 'abc123'
    },
    'doc/template/README.md': {
        'size': 3819,
        'mtime': 1729450740,
        'sha1': 'def456'
    },
    'doc/template/guide/first-principles.md': {
        'size': 10000,
        'mtime': 1729450740,
        'sha1': 'ghi789'
    },
}

# Simulated filesystem (what exists now)
filesystem = {
    'doc/overview.md': {
        'size': 17465,
        'mtime': 1729350000
    },
    # template files are gone!
}

def detect_changes():
    print("Git Status Analysis:")
    print("=" * 50)

    # Check for deletions and modifications
    for path, metadata in git_index.items():
        if path not in filesystem:
            print(f"  deleted:    {path}")
        elif filesystem[path]['mtime'] != metadata['mtime']:
            print(f"  modified:   {path}")
        else:
            print(f"  unchanged:  {path}")

    # Check for untracked files
    for path in filesystem:
        if path not in git_index:
            print(f"  untracked:  {path}")

detect_changes()

# Output:
# Git Status Analysis:
# ==================================================
#   unchanged:  doc/overview.md
#   deleted:    doc/template/README.md
#   deleted:    doc/template/guide/first-principles.md
```

---

## Index File Structure

The `.git/index` file is a **binary file** with the following structure:

```
Git Index File Structure:
┌────────────────────────────────────────────────┐
│ Header (12 bytes)                              │
│ ├─ Signature: "DIRC" (DIRectory Cache)        │
│ ├─ Version: 2 or 3 (4 bytes)                  │
│ └─ Entry count: number of files (4 bytes)     │
├────────────────────────────────────────────────┤
│ Entry 1: (variable length)                     │
│ ├─ ctime: seconds (4 bytes)                   │
│ ├─ ctime: nanoseconds (4 bytes)               │
│ ├─ mtime: seconds (4 bytes)                   │
│ ├─ mtime: nanoseconds (4 bytes)               │
│ ├─ device: (4 bytes)                          │
│ ├─ inode: (4 bytes)                           │
│ ├─ mode: file permissions (4 bytes)           │
│ ├─ uid: user id (4 bytes)                     │
│ ├─ gid: group id (4 bytes)                    │
│ ├─ file size: (4 bytes)                       │
│ ├─ SHA-1: content hash (20 bytes)             │
│ ├─ flags: (2 bytes)                           │
│ └─ path: null-terminated string (variable)    │
├────────────────────────────────────────────────┤
│ Entry 2: (same structure)                      │
├────────────────────────────────────────────────┤
│ ... (more entries)                              │
├────────────────────────────────────────────────┤
│ Extensions (optional)                           │
├────────────────────────────────────────────────┤
│ Checksum: SHA-1 of entire index (20 bytes)    │
└────────────────────────────────────────────────┘
```

### Example Entry

```
Entry for "doc/template/README.md":
├─ ctime: 1729450740 (Oct 20, 2025)
├─ mtime: 1729450740
├─ file size: 3819 bytes
├─ SHA-1: def45678901234567890123456789012345678901
├─ flags: 0
└─ path: "doc/template/README.md"
```

---

## Why This is Efficient

Git's approach is highly optimized:

### What Git DOESN'T Do (Inefficient)

❌ **Watch files in real-time**
- No file system watchers
- No background processes monitoring changes
- No inotify/FSEvents hooks

❌ **Store full file contents in index**
- Index only stores metadata
- Actual content in `.git/objects/` (compressed)

❌ **Poll for changes constantly**
- Only checks when you run `git status`
- No periodic background scanning

❌ **Compare file contents for every status check**
- First checks mtime (modification time)
- Only computes SHA-1 if mtime changed

### What Git DOES (Efficient)

✅ **Snapshot-based comparison**
- Compare index vs. filesystem on demand
- Simple list comparison (fast)

✅ **Metadata-only storage**
- Path, size, timestamps, hash
- ~62 bytes per file in index (plus path length)

✅ **Lazy evaluation**
- Uses `stat()` system call (very fast)
- Only computes SHA-1 if needed

✅ **Optimized hash checking**
- If mtime and size match → assume unchanged
- Skip expensive content hashing

### Performance Example

```bash
# For a repo with 10,000 files:

# Step 1: Read index
# - Read 10,000 entries from .git/index
# - Time: ~10ms (single file read)

# Step 2: Scan filesystem
# - Call stat() on each file
# - Time: ~100ms (10,000 syscalls)

# Step 3: Compare
# - Compare 10,000 entries
# - Time: ~5ms (in-memory comparison)

# Total: ~115ms for 10,000 files
# Compare to: Hours if reading full file contents!
```

---

## The Comparison Process

### Visual Flow Diagram

```
┌────────────────────────────────────────────────────────┐
│  YOU RUN: git status                                    │
└───────────────────┬────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Git reads .git/index │
        │  (List of 164 files)  │
        │                       │
        │  doc/overview.md      │
        │  doc/template/...     │
        │  doc/1-planning/...   │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Git scans filesystem  │
        │ (What actually exists)│
        │                       │
        │  doc/overview.md ✓    │
        │  doc/template/ ✗      │
        │  doc/1-planning/ ✓    │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────────────────┐
        │ For each file in index:           │
        │                                   │
        │   1. Check if exists on disk      │
        │      └─ stat(path) != ENOENT      │
        │                                   │
        │   2. Check mtime (modified time)  │
        │      └─ Compare timestamps        │
        │                                   │
        │   3. If mtime changed:            │
        │      └─ Compute SHA-1 hash        │
        │      └─ Compare to stored hash    │
        └───────────┬───────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────┐
        │ RESULTS:                         │
        │                                  │
        │ • In index, NOT on disk → DELETE │
        │ • On disk, NOT in index → UNTRACK│
        │ • Different hash → MODIFIED      │
        │ • Same hash → UNCHANGED          │
        └──────────────────────────────────┘
```

### Step-by-Step Example

**Scenario:** You moved `doc/template/` directory

```bash
# BEFORE MOVE
# ============

# Index contains:
doc/template/README.md       (tracked)
doc/template/guide/first.md  (tracked)
doc/overview.md              (tracked)

# Filesystem contains:
doc/template/README.md       ✓ exists
doc/template/guide/first.md  ✓ exists
doc/overview.md              ✓ exists

# git status output: (nothing)


# AFTER MOVE (mv doc/template /other/location/)
# =============================================

# Index STILL contains:
doc/template/README.md       (tracked)
doc/template/guide/first.md  (tracked)
doc/overview.md              (tracked)

# Filesystem now contains:
doc/overview.md              ✓ exists
# doc/template/ is GONE!

# git status detects:
1. Check doc/template/README.md
   └─ stat("doc/template/README.md") → ENOENT (file not found)
   └─ Result: DELETED

2. Check doc/template/guide/first.md
   └─ stat("doc/template/guide/first.md") → ENOENT
   └─ Result: DELETED

3. Check doc/overview.md
   └─ stat("doc/overview.md") → exists
   └─ mtime matches → UNCHANGED

# git status output:
# deleted: doc/template/README.md
# deleted: doc/template/guide/first.md
```

---

## Real Git Commands

### Inspect the Index

```bash
# 1. View index file info
file .git/index
# Output: Git index, version 2, 164 entries

# 2. List all tracked files with full metadata
git ls-files --stage
# Output format:
# <mode> <object> <stage> <file>
# 100644 79dcede75b8d9679d629c4eac568aeaee46683b3 0 .gitignore

# 3. List just filenames
git ls-files

# 4. List files in specific directory
git ls-files | grep "^doc/template"

# 5. Check if specific file is tracked
git ls-files | grep "doc/template/README.md"
```

### Compare Working Directory to Index

```bash
# 1. Show status (high-level)
git status

# 2. Show status (short format)
git status --short
# Output:
# M  modified-file.txt
# D  deleted-file.txt
# ?? untracked-file.txt

# 3. Compare working directory to index (low-level)
git diff-files
# Shows which tracked files have changed

# 4. Compare working directory to index (with names)
git diff-files --name-status

# 5. Compare index to HEAD (last commit)
git diff-index --name-status HEAD

# 6. Show what would be committed
git diff --cached
# or
git diff --staged
```

### Understanding File Status

```bash
# Status symbols:
#   M = Modified (file changed)
#   D = Deleted (file removed)
#   A = Added (new file staged)
#   ?? = Untracked (not in index)
#   R = Renamed (file moved)
#   C = Copied

# Example output:
git status --short
# Output:
#  M doc/overview.md        # Modified, not staged
# M  doc/project.md         # Modified, staged
# D  doc/template/README.md # Deleted, staged
# ?? new-file.txt           # Untracked
```

### Low-Level Plumbing Commands

```bash
# 1. Read index entries (C-style output)
git ls-files --debug

# 2. Check if file is up-to-date
git diff-files --name-only

# 3. Update index to match working directory
git add --update
# or
git add -u

# 4. Remove deleted files from index
git add --all
# or
git add -A

# 5. Show tracked files that have been deleted
git ls-files --deleted
```

---

## Practical Example

### Real-World Scenario: Moving a Directory

Let's trace what happens when you move `doc/template/` to a new location.

**Step 1: Before the Move**

```bash
# Check current state
$ git status
On branch main
nothing to commit, working tree clean

# Index contains 55 files in doc/template/
$ git ls-files | grep "^doc/template" | wc -l
55

# Filesystem has the same files
$ ls doc/template/
README.md  guide/  design-principle/  ...
```

**Step 2: Execute the Move**

```bash
# Move directory to new location
$ mv doc/template /home/developer/se-learning-system/doc/template

# Verify files are gone
$ ls doc/template
ls: cannot access 'doc/template': No such file or directory
```

**Step 3: Git Detects the Changes**

```bash
# Run git status
$ git status

# What Git does internally:
# 1. Read .git/index (has 55 files listed)
# 2. For each file, call stat():
#    stat("doc/template/README.md") → ENOENT (No such file)
#    stat("doc/template/guide/first-principles.md") → ENOENT
#    ... (53 more files)
# 3. All return "file not found"
# 4. Git marks all 55 files as DELETED

# Output:
Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	deleted:    doc/template/README.md
	deleted:    doc/template/guide/first-principles-approach.md
	deleted:    doc/template/design-principle/solid-principle.md
	... (52 more files)
```

**Step 4: Stage the Deletions**

```bash
# Stage all changes (including deletions)
$ git add -A

# or specifically for deletions
$ git add -u

# What Git does:
# - Updates .git/index to remove those 55 entries
# - Index now reflects the new state
```

**Step 5: Commit the Changes**

```bash
$ git commit -m "refactor(docs): move template to standalone repo"

# What Git does:
# 1. Create new tree object (without template files)
# 2. Create new commit object
# 3. Update HEAD to point to new commit
```

**Step 6: Verification**

```bash
# Check index now
$ git ls-files | grep "^doc/template" | wc -l
0

# Verify working directory matches index
$ git status
On branch main
nothing to commit, working tree clean
```

---

## Summary

### How Git Detects File Changes

```
┌─────────────────────────────────────────────────┐
│ Git Change Detection - Complete Picture         │
└─────────────────────────────────────────────────┘

1. Git maintains an INDEX (.git/index)
   └─ Binary file listing all tracked files
   └─ Contains: path, size, mtime, SHA-1 hash

2. When you run 'git status':
   ├─ Read INDEX (list of tracked files)
   ├─ Scan FILESYSTEM (actual files)
   └─ COMPARE the two

3. For each file in index:
   ├─ stat(file) → does it exist?
   │  ├─ No → DELETED
   │  └─ Yes → continue
   ├─ Compare mtime (modification time)
   │  ├─ Same → UNCHANGED (optimization)
   │  └─ Different → compute SHA-1
   └─ Compare SHA-1 hash
      ├─ Same → UNCHANGED
      └─ Different → MODIFIED

4. For each file on filesystem:
   └─ Not in index? → UNTRACKED

5. Display results to user
```

### Key Concepts

| Concept | Explanation |
|---------|-------------|
| **Index** | Binary file (`.git/index`) containing list of tracked files with metadata |
| **Working Directory** | Your actual filesystem with real files you can edit |
| **Tracking** | Git "knows about" a file (it's in the index) |
| **Deletion Detection** | File in index but not on filesystem → deleted |
| **Modification Detection** | File has different mtime or SHA-1 hash → modified |
| **Untracked** | File on filesystem but not in index → untracked |
| **stat()** | System call to get file metadata (fast) |
| **SHA-1** | Content hash (expensive to compute, only done if needed) |

### Performance Characteristics

- **Time Complexity:** O(n) where n = number of tracked files
- **Space Complexity:** O(n) for index storage
- **Optimization:** mtime check before SHA-1 computation
- **Scalability:** Efficient for repos with 100,000+ files

### Why This Design is Brilliant

1. **No background processes** - Zero overhead when not using Git
2. **Fast status checks** - Milliseconds even for large repos
3. **Accurate detection** - SHA-1 ensures content integrity
4. **Simple algorithm** - Easy to understand and implement
5. **Portable** - Works on any filesystem

---

## References

### Official Git Documentation

- [Git Internals - Git Objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
- [Git Index Format](https://github.com/git/git/blob/master/Documentation/technical/index-format.txt)
- [Git Status Documentation](https://git-scm.com/docs/git-status)
- [Git Diff Files](https://git-scm.com/docs/git-diff-files)

### Books

- **Pro Git (2nd Edition)** - Scott Chacon, Ben Straub
  - Chapter 10: Git Internals
  - Free: https://git-scm.com/book/en/v2

- **Building Git** - James Coglan
  - Low-level implementation details
  - https://shop.jcoglan.com/building-git/

### Technical Articles

- [How Git Works: A Visual Guide](https://www.freecodecamp.org/news/git-internals-objects-branches-create-repo/)
- [Understanding Git Index](https://mincong.io/2018/04/28/git-index/)
- [Git Index Format Technical Documentation](https://github.com/git/git/blob/master/Documentation/technical/index-format.txt)

### Source Code

- [Git Source Code - `read-cache.c`](https://github.com/git/git/blob/master/read-cache.c)
  - Implementation of index reading/writing

- [Git Source Code - `diff-files.c`](https://github.com/git/git/blob/master/builtin/diff-files.c)
  - Implementation of working directory comparison

### Related Commands

```bash
# Explore Git internals yourself
git help internals          # Overview of Git internals
git help ls-files           # Index inspection
git help diff-files         # Working directory comparison
git help diff-index         # Index vs commit comparison
git help update-index       # Low-level index manipulation
```

---

## Appendix: Try It Yourself

### Experiment 1: Watch Git Detect Changes

```bash
# 1. Create a test file
echo "Hello Git" > test.txt
git add test.txt
git commit -m "Add test file"

# 2. Check index
git ls-files --stage | grep test.txt
# Output: 100644 8b8e1b06... 0 test.txt

# 3. Delete the file
rm test.txt

# 4. Check status
git status
# Output: deleted: test.txt

# 5. Verify Git still tracks it
git ls-files | grep test.txt
# Output: test.txt (still in index!)

# 6. Stage the deletion
git add test.txt

# 7. Now it's removed from index
git ls-files | grep test.txt
# Output: (empty - file removed from index)
```

### Experiment 2: Understand mtime Optimization

```bash
# 1. Create and commit a file
echo "Version 1" > demo.txt
git add demo.txt
git commit -m "Add demo"

# 2. Check index mtime
git ls-files --debug | grep -A 10 demo.txt

# 3. Modify file content but restore mtime
echo "Version 2" > demo.txt
touch -t 202510201200 demo.txt  # Set specific mtime

# 4. Git status (might miss change if mtime matches!)
git status
# Modern Git also checks size, so this might still detect
```

### Experiment 3: Large Repo Performance

```bash
# Create 10,000 test files
for i in {1..10000}; do
    echo "File $i" > "file_$i.txt"
done

# Add all files
time git add .
# Measure time to build index

# Check status
time git status
# Measure time to compare

# Cleanup
git rm -f file_*.txt
```

---

**Last Updated:** 2025-10-20
**Version:** 1.0
**Author:** PHD Systems & PHD Labs
**License:** Free to use for educational purposes

---

**Questions or improvements?** This guide is based on Git version 2.x behavior. Implementation details may vary slightly between versions, but the core concepts remain the same.
