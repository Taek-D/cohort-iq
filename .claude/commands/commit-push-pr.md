# 커밋 → 푸시 → PR 생성

변경사항을 커밋하고, 푸시한 후 PR을 생성합니다.

## 단계

### 1. 변경사항 확인
```bash
git status
git diff --stat
```

### 2. 빌드 확인
```bash
cd cohort-iq && npm run build
```

### 3. 커밋
- 커밋 메시지 컨벤션: `type: description`
- type: feat, fix, refactor, docs, style, test, chore

```bash
git add -A
git commit -m "$ARGUMENTS"
```

### 4. 푸시 및 PR
```bash
git push -u origin $(git branch --show-current)
gh pr create --title "$ARGUMENTS" --body "## Summary\n\n## Changes\n\n## Test Plan\n"
```
