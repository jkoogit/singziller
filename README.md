# 노래질러 Singziller

태진 TJ와 금영 KY 노래방 곡 목록을 검색하고, 번호 매핑 후보, 레파토리, 북마크 그룹, 녹음, CSV/JSON import-export를 관리하는 정적 PWA입니다.

## 실행

`index.html`을 브라우저에서 열면 바로 사용할 수 있습니다. 서비스워커 오프라인 캐시는 `http://localhost` 또는 HTTPS 환경에서 활성화됩니다.

## 주요 기능

- 태진/금영 브랜드별 검색 및 브랜드 미선택 통합 검색
- 제목, 가수, 번호, 분류, 버전, 링크 유무, 정렬 조건 UI
- 제목+가수 정규화 기준의 TJ/KY 번호 매핑 후보 표시
- 금영의 MR, 반주, 라이브 등 다중 버전 표시
- 레파토리와 북마크 그룹 로컬 관리
- 녹음, 공유, 다운로드
- CSV/JSON import-export
- Google OAuth Client ID와 Spreadsheet ID 설정 저장 및 Sheets 동기화 페이로드 준비

## 관리 문서

- [문서 색인](docs/README.md)
- [서비스 기획서](docs/01-planning/서비스-기획서.md)
- [요구사항 정의서](docs/02-requirements/요구사항-정의서.md)
- [화면 설계서](docs/03-screen-design/화면-설계서.md)
- [서비스 설계서](docs/04-service-design/서비스-설계서.md)
- [작업 일정](docs/08-project-management/작업-일정.md)
- [브랜치 운영 프로세스](docs/08-project-management/브랜치-운영-프로세스.md)

## Google Sheets 연동

Google Identity Services token flow와 Google Sheets REST API를 사용합니다. 보안상 `file://`에서는 Google OAuth가 동작하지 않으므로 localhost 또는 HTTPS 배포 주소에서 실행해야 합니다.

1. Google Cloud Console에서 OAuth 동의 화면을 만들고, OAuth Client ID 유형을 `Web application`으로 생성합니다.
2. 테스트용 Authorized JavaScript origins에 `http://localhost:4173` 또는 실제 배포 도메인을 추가합니다.
3. Google Sheets API를 사용 설정합니다.
4. 앱의 동기화 탭에 OAuth Client ID, Spreadsheet ID, Sheet 이름을 입력하고 설정 저장을 누릅니다.
5. 구글 로그인 후 `시트에서 가져오기`, `시트 전체 덮어쓰기`, `현재 곡 추가 업로드`를 사용할 수 있습니다.

시트 컬럼은 다음 순서를 기준으로 합니다. 첫 행은 반드시 헤더로 둡니다.

```csv
brand,title,artist,songNumber,category,version,createdAt,updatedAt,createdBy,youtubeUrl,spotifyUrl
```

권장 Sheet 이름은 `songs`입니다. 전체 덮어쓰기는 `A1:K` 범위를 헤더 포함으로 갱신하고, 추가 업로드는 현재 로컬 곡 목록을 시트 끝에 append합니다.
