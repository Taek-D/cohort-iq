# 린트 자동 수정

Prettier를 사용하여 코드 스타일을 자동으로 수정합니다.

## 실행

```bash
cd cohort-iq && npx prettier --write "src/**/*.js"
```

## 규칙 (.prettierrc 기준)
- 싱글 쿼트 사용
- trailing comma (ES5 호환)
- 세미콜론 사용
- 들여쓰기: 2 spaces
- 줄 길이: 80자

## 특정 파일만 수정

```bash
cd cohort-iq && npx prettier --write "src/core/*.js"
```

## 검사만 (수정 없이)

```bash
cd cohort-iq && npx prettier --check "src/**/*.js"
```
