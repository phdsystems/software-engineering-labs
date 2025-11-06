# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the software-engineering-labs repository.

---

## Available Workflows

### 1. Link Validation (`link-validation.yml`)

**Purpose:** Automatically validate internal markdown links in documentation

**Triggers:**
- ✅ **Push** to `main` or `develop` branches (when markdown files change)
- ✅ **Pull Request** to `main` or `develop` (when markdown files change)
- ✅ **Schedule** - Weekly on Mondays at 9 AM UTC
- ✅ **Manual** - Can be triggered manually via GitHub Actions UI

**What it does:**
1. Checks out the repository
2. Sets up Python 3.11
3. Runs `link-checker.py` on all documentation
4. Uploads detailed report as artifact
5. Comments on PR if links are broken
6. Fails the build if broken links found

**Outputs:**
- **Job Summary** - Quick stats in GitHub Actions UI
- **Artifact** - Full `link-report.txt` (kept for 30 days)
- **PR Comment** - Automated comment with broken link summary (on failures)

---

## Workflow Details

### Link Validation Workflow

#### When It Runs

**On Push:**
```yaml
on:
  push:
    branches: [ main, develop ]
    paths:
      - 'doc/**/*.md'
      - 'README.md'
      - 'link-checker.py'
```
Only runs when markdown files or the link checker itself changes.

**On Pull Request:**
- Runs for PRs targeting `main` or `develop`
- Only when documentation files are modified
- Posts results as PR comment if links are broken

**Weekly Schedule:**
- Every Monday at 9 AM UTC
- Catches link rot over time
- Good for maintenance

**Manual Trigger:**
- Go to Actions tab → Link Validation → Run workflow
- Useful for testing or ad-hoc validation

#### Output Examples

**Success:**
```
✅ All Links Valid!
- Total links: 657
- Success rate: 100.0%
```

**Failure:**
```
❌ Broken Links Found
- Broken links: 12
- Total links: 657
- Success rate: 98.2%

Action Required: Fix broken links before merging.
```

**PR Comment (on failure):**
```markdown
## ❌ Link Validation Failed

**Statistics:**
- Broken links: 12
- Total links: 657
- Success rate: 98.2%

**Most Common Issues:**
```
  4x  ../missing-file.md
  3x  overview.md
  2x  example/README.md
```

**What to do:**
1. Download the full report from the workflow artifacts
2. Run `python3 scripts/link-checker.py doc/` locally to see all issues
3. Fix broken links before merging
4. See `LINK_CHECKER_README.md` for help
```

---

## Using Workflows Locally

### Test Before Pushing

```bash
# Run the same checks locally
python3 scripts/link-checker.py doc/
```

### Simulate CI Environment

```bash
# Install act (GitHub Actions local runner)
# https://github.com/nektos/act

# Run workflow locally
act push
```

---

## Workflow Configuration

### Customizing Triggers

**Only run on documentation changes:**
```yaml
paths:
  - 'doc/**/*.md'
  - 'README.md'
```

**Change schedule:**
```yaml
schedule:
  # Daily at midnight UTC
  - cron: '0 0 * * *'

  # Every 6 hours
  - cron: '0 */6 * * *'
```

**Add more branches:**
```yaml
branches: [ main, develop, staging, production ]
```

### Adjusting Failure Threshold

To allow some broken links without failing:

```yaml
- name: Fail if too many broken links
  if: steps.link_check.outputs.broken_links > 10
  run: exit 1
```

### Disabling PR Comments

Remove or comment out:
```yaml
- name: Comment on PR (if failures)
  if: failure() && github.event_name == 'pull_request'
  # ... (comment out this entire step)
```

---

## Monitoring Workflow Runs

### View Results

1. Go to repository → **Actions** tab
2. Click on **Link Validation** workflow
3. See recent runs and their status

### Download Reports

1. Click on a workflow run
2. Scroll to **Artifacts** section
3. Download `link-validation-report`
4. Contains full `link-report.txt`

### Check Trends

- Weekly runs help track link health over time
- Compare reports to see improvement/degradation
- Identify files that frequently break

---

## Troubleshooting

### Workflow Not Running

**Check trigger conditions:**
- Are you modifying files in the `paths:` list?
- Is the branch in the `branches:` list?

**Check workflow file:**
```bash
# Validate YAML syntax
yamllint .github/workflows/link-validation.yml
```

### False Positives

If the workflow reports broken links that are actually valid:

1. Check if files are gitignored (not in repository)
2. Check if files are generated during build
3. Add exclusions to `link-checker.py`:
```python
IGNORE_PATTERNS = ['generated/', 'template-']
```

### Workflow Failing Unexpectedly

**Download the artifact:**
1. View the failed workflow run
2. Download `link-validation-report`
3. Review the full report locally

**Run locally:**
```bash
python3 scripts/link-checker.py doc/
```
Compare local results with CI results.

---

## Best Practices

### Development Workflow

1. **Before committing:**
   ```bash
   python3 scripts/link-checker.py doc/
   ```

2. **Fix all broken links** before pushing

3. **Push and create PR** - workflow validates automatically

4. **Review PR comment** if validation fails

5. **Merge** only after validation passes

### Maintenance

**Weekly review:**
- Check scheduled workflow runs
- Fix any link rot
- Update documentation as needed

**After refactoring:**
- Always run link checker locally
- Verify all moved files are properly linked
- Update cross-references

**Before releases:**
- Manually trigger workflow
- Ensure 100% link validity
- Fix any issues found

---

## Extending Workflows

### Add More Validation

**Spell checking:**
```yaml
- name: Spell check
  uses: rojopolis/spellcheck-github-actions@0.36.0
  with:
    config_path: .spellcheck.yml
```

**Markdown linting:**
```yaml
- name: Markdown lint
  uses: DavidAnson/markdownlint-cli2-action@v15
  with:
    globs: 'doc/**/*.md'
```

**Check external links:**
```yaml
- name: Check external links
  uses: lycheeverse/lychee-action@v1
  with:
    args: --verbose --no-progress 'doc/**/*.md'
```

### Notify on Failure

**Slack notification:**
```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Link validation failed: ${{ github.event.head_commit.message }}"
      }
```

**Email notification:**
```yaml
- name: Send email
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Link Validation Failed
    body: See ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    to: team@example.com
    from: GitHub Actions
```

---

## Security Considerations

### Workflow Permissions

Current workflow needs:
- ✅ `contents: read` - Read repository files (default)
- ✅ `pull-requests: write` - Comment on PRs (for PR comments)

**To restrict permissions:**
```yaml
permissions:
  contents: read
  pull-requests: write
```

### Secrets

No secrets required for basic link validation.

If adding notifications or external services:
1. Add secrets in repository settings
2. Reference as `${{ secrets.SECRET_NAME }}`
3. Never log or expose secrets

---

## Resources

- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **Workflow Syntax:** https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **Link Checker Tool:** See `../LINK_CHECKER_README.md`
- **Cron Syntax:** https://crontab.guru/

---

**Last Updated:** 2025-11-06
**Workflows:** 1 (Link Validation)
**Status:** Active
