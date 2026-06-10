# DB 환경 구성

## 목적

Singziller는 `dev`, `stg`, `main` 브랜치 흐름에 맞춰 PostgreSQL DB도 개발, 검증, 운영 환경을 분리한다. 한 Ubuntu 서버에서 Docker 기반 PostgreSQL을 운영하되, 각 환경은 포트, 계정, 볼륨, DB명을 독립적으로 사용한다.

## 확정 환경

| 환경 | 브랜치 기준 | DB 포트 | DB 계정 | Docker 볼륨명 | DB명 |
| --- | --- | ---: | --- | --- | --- |
| 개발 | `dev` | `35432` | `devdbszusr` | `postSzDev` | `singziller_dev` |
| 검증 | `stg` | `45432` | `stgdbszusr` | `postSzStg` | `singziller_stg` |
| 운영 | `main` | `55432` | `prddbszusr` | `postSzPrd` | `singziller_prd` |

## 네트워크 정책

- PostgreSQL 포트는 외부 인터넷에 공개하지 않는다.
- API 서버와 PostgreSQL은 같은 Docker 내부 네트워크에서 통신한다.
- 호스트 포트 바인딩이 필요한 경우에도 방화벽과 Docker 바인딩 정책으로 내부 접근만 허용한다.
- 운영 DB는 개발/검증 컨테이너와 계정, 볼륨, DB명을 공유하지 않는다.

## PostgreSQL 환경변수 파일 위치

PostgreSQL 컨테이너 생성과 운영에 필요한 실제 계정, 비밀번호, DB명은 Ubuntu 서버의 환경별 `.env` 파일에서 관리한다. 실제 비밀번호가 들어가는 파일은 저장소에 커밋하지 않는다.

Ubuntu 서버 기준 위치:

```text
/opt/singziller/postgres/dev/.env   개발 PostgreSQL 환경변수
/opt/singziller/postgres/stg/.env   검증 PostgreSQL 환경변수
/opt/singziller/postgres/prd/.env   운영 PostgreSQL 환경변수
```

확인 명령:

```bash
cat /opt/singziller/postgres/dev/.env
cat /opt/singziller/postgres/stg/.env
cat /opt/singziller/postgres/prd/.env
```

개발 환경 예시:

```env
POSTGRES_USER=devdbszusr
POSTGRES_PASSWORD=change-me
POSTGRES_DB=singziller_dev
POSTGRES_PORT=35432
POSTGRES_VOLUME=postSzDev
```

검증 환경 예시:

```env
POSTGRES_USER=stgdbszusr
POSTGRES_PASSWORD=change-me
POSTGRES_DB=singziller_stg
POSTGRES_PORT=45432
POSTGRES_VOLUME=postSzStg
```

운영 환경 예시:

```env
POSTGRES_USER=prddbszusr
POSTGRES_PASSWORD=change-me
POSTGRES_DB=singziller_prd
POSTGRES_PORT=55432
POSTGRES_VOLUME=postSzPrd
```

애플리케이션 서버의 `DATABASE_URL`은 위 PostgreSQL 환경변수를 바탕으로 배포 단계에서 만든다. Docker 내부 네트워크를 사용할 때 `DATABASE_URL` 호스트는 외부 공개 포트가 아니라 PostgreSQL 컨테이너 서비스명으로 둔다. 예를 들어 개발 환경 서비스명이 `postgres-dev`이면 앱은 `postgres-dev:5432`로 접속한다.

호스트에서 직접 점검할 때만 내부 접근용 포트를 사용한다.

```text
dev: 127.0.0.1:35432
stg: 127.0.0.1:45432
prd: 127.0.0.1:55432
```

## 브랜치와 DB 매핑

- `dev` 브랜치 작업과 개발 검증은 `singziller_dev`만 사용한다.
- `stg` 브랜치 검증은 `singziller_stg`만 사용한다.
- `main` 배포는 `singziller_prd`만 사용한다.
- migration 파일은 동일한 소스를 사용하고, 실행 대상은 환경별 `DATABASE_URL`로만 구분한다.

## 운영 주의사항

- PostgreSQL `.env` 파일은 `/opt/singziller/postgres/{dev,stg,prd}/.env`에서만 관리한다.
- 운영 DB 계정은 최소 권한 원칙을 적용한다.
- 백업 정책은 운영 DB부터 우선 확정한다.
- migration 실행 전 대상 `DATABASE_URL`과 현재 브랜치를 로그로 출력한다.
