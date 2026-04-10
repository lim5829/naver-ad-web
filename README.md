# 네이버 광고 관리 — 웹 앱

## 📁 파일 구조

```
naver-ad-web/
├── index.html              ← 진입점 (모든 JS 로드)
├── js/
│   ├── theme.js            ← 테마 색상, 프록시 URL, 프리셋 기본값
│   ├── icons.js            ← SVG 아이콘 모음
│   ├── api.js              ← API 호출, 데이터 파싱, 유틸 함수
│   ├── ui.js               ← 공통 UI (Button, Card, Input, Toast, Badge 등)
│   ├── page-auth.js        ← 로그인 / 회원가입 페이지
│   ├── page-settings.js    ← API 설정 페이지
│   ├── page-campaigns.js   ← 캠페인 관리 (프리셋, 입찰가, 광고그룹)
│   ├── page-cost.js        ← 광고비 통계 (탭바, 차트, 캠페인별 상세)
│   └── app.js              ← 메인 App (라우팅, 자동로그인, 탭 관리)
└── README.md               ← 이 파일
```

## 🔧 수정 가이드

| 변경하고 싶은 것 | 수정할 파일 |
|---|---|
| 색상, 테마 | `js/theme.js` |
| 프록시 서버 URL | `js/theme.js` → `PRODUCTION_PROXY_URL` |
| 입찰가 프리셋 기본값 | `js/theme.js` → `DEFAULT_PRESETS` |
| 아이콘 추가/변경 | `js/icons.js` |
| API 호출 방식 | `js/api.js` |
| 버튼, 카드, 인풋 스타일 | `js/ui.js` |
| 로그인/회원가입 UI | `js/page-auth.js` |
| API 설정 화면 | `js/page-settings.js` |
| 캠페인 목록, 입찰가 수정 | `js/page-campaigns.js` |
| 광고비 통계, 차트 | `js/page-cost.js` |
| 페이지 라우팅, 자동로그인 | `js/app.js` |

## 🚀 배포

### Cloudflare Pages (추천)
1. `naver-ad-web` 폴더를 통째로 ZIP
2. Cloudflare → Workers & Pages → Create → Pages → Upload assets
3. ZIP 드래그 앤 드롭 → Deploy

### 로컬 테스트
```bash
cd naver-ad-web
python3 -m http.server 8080
# 또는
npx serve
```
→ `http://localhost:8080` 접속

## ⚠️ 주의사항

- Babel이 브라우저에서 JSX를 변환하므로 **빌드 도구 불필요**
- `<script>` 로드 순서가 중요 (theme → icons → api → ui → pages → app)
- 프로덕션에서는 Vite/Webpack으로 빌드하면 성능 향상 가능

## 🔗 관련 파일

- `worker.js` — Cloudflare Workers 백엔드 (별도 배포)
- `wrangler.toml` — Workers 배포 설정
