# Simple Mobile Shopping Site (쇼핑몰 + 관리자)

간단한 모바일 전용 쇼핑몰 예제입니다.  
관리자 페이지에서 '메인 이미지'와 '상세 이미지'를 업로드하면 사용자 페이지에 순서대로 표시됩니다. 관리자는 업로드 / 삭제 / 순서 변경만 가능합니다.

## 빠른 시작 (로컬)
1. Node.js 설치 (v16+ 권장)
2. 프로젝트 폴더에서 설치:
   ```bash
   npm install
   ```
3. 실행:
   ```bash
   npm start
   ```
4. 브라우저에서 열기:
   - 사용자 페이지: `http://localhost:3000/`
   - 관리자 페이지: `http://localhost:3000/admin.html` (비밀번호 입력 필요)
   - 기본 관리자 비밀번호: `admin123` (환경변수 `ADMIN_PASS`로 변경 가능)

## 파일 구조
```
/public           # 프론트엔드 정적 파일 (index.html, admin.html, styles.css)
server.js         # 간단한 Express 서버 (API: /api/*)
data.json         # 이미지 목록 및 순서 저장
/uploads          # 업로드된 이미지 폴더
package.json
```

## 배포 (권장: Render, Railway 등)
Vercel은 서버에서 파일을 계속 쓰는 기능이 제한적이라 uploads 같은 파일 저장이 필요한 경우 Render 또는 Railway 사용을 권장합니다.
1. GitHub에 이 레포를 올립니다.
2. Render (or Railway)에 로그인 -> New Web Service -> GitHub 레포 선택 -> 빌드 명령 없음, Start Command: `npm start`
3. 배포 완료 후 발급된 `https://...` 주소로 접속 가능합니다.

## 사용 흐름
- LINE 채팅창에 홈페이지 주소를 넣으면 사용자가 링크를 클릭해서 모바일 전용 리스트가 열립니다.
- 관리자는 `/admin.html` 접속하여 비밀번호 입력 후 업로드, 순서 변경, 삭제를 수행합니다.
- 업로드하면 사용자 페이지에 즉시 반영됩니다.

---
문제가 있거나 Vercel/Render에 배포하는 자세한 단계가 필요하면 바로 도와드릴게요.
