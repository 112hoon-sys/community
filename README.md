# K-Connect Community

한국 거주 외국인을 위한 커뮤니티 플랫폼 (반응형 웹)

## 기능

- **인증**: Google 계정 로그인
- **게시판**: 생활정보, 지역별, 국적별, 직업·학업, 중고거래, 해외송금
- **SNS**: 댓글, 공유, 좋아요
- **환율**: SBI 코스머니 환율 연동 (스크래핑), 메인 노출

## 프로젝트 구조

```
커뮤니티/
├── src/
│   ├── components/     # UI 컴포넌트
│   ├── pages/          # 페이지
│   ├── layouts/        # 레이아웃
│   ├── contexts/       # React Context (Auth 등)
│   ├── config/         # 설정 (게시판 카테고리 등)
│   └── lib/            # 유틸, API 클라이언트
├── server/             # 백엔드 API
│   ├── routes/         # API 라우트
│   └── services/       # 스크래퍼 등 서비스
└── ...
```

## 시작하기

### 1. 의존성 설치

```bash
# 프론트엔드
npm install

# 백엔드 (환율 API용)
cd server && npm install && cd ..
```

### 2. 환경 변수

`.env.example`을 복사해 `.env` 생성 후 값 입력:

```bash
cp .env.example .env
```

- `VITE_GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID (Google Cloud Console)
- `VITE_API_URL`: 프로덕션 API URL (개발 시 Vite proxy 사용)
- `DATABASE_URL`: SQLite 경로 (기본 `file:./dev.db`)

### 3. DB 초기화

```bash
cd server
npx prisma generate
npx prisma db push
node prisma/seed.js
cd ..
```

### 4. 실행

```bash
# 프론트엔드만 (개발)
npm run dev

# 프론트엔드 + 백엔드 동시
npm run dev:all
```

- 프론트: http://localhost:5173
- API: http://localhost:3001

## 기술 스택

- **Frontend**: React 18, Vite, React Router, Google OAuth
- **Backend**: Node.js, Express, Prisma
- **DB**: SQLite

