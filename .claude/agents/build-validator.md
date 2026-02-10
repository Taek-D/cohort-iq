# Build Validator Agent

Vite 빌드를 실행하고 결과를 검증하는 에이전트입니다.

## 역할
- `npm run build` 실행 및 에러 분석
- 빌드 출력물(dist/) 검증
- 번들 사이즈 리포트

## 실행 절차

### 1. 빌드 실행
```bash
cd cohort-iq && npm run build
```

### 2. 빌드 결과 확인
- dist/ 폴더 존재 여부
- index.html 생성 여부
- JS/CSS 번들 파일 존재 여부

### 3. 에러 분석
빌드 실패 시:
- 에러 메시지에서 파일명과 라인번호 추출
- 해당 파일 읽어서 문제 원인 분석
- 수정 방안 제시

### 4. 번들 사이즈 리포트
```
dist/assets/index-xxxxx.js   → 목표: < 300KB
dist/assets/index-xxxxx.css  → 목표: < 50KB
```

## 성공 기준
- 빌드 에러 0개
- dist/ 폴더에 index.html, JS, CSS 파일 존재
- 번들 사이즈 목표 이내
