# 보안 강화 가이드: 권한 탈취 및 임의 변경 취약점 차단

일반 사용자가 브라우저 개발자 도구(콘솔 입력 등)나 클라이언트 측 API 요청을 위조하여 본인의 권한을 최고관리자(`admin` 등)로 격상시킬 수 있는 취약점을 발견하고 이를 이중(프론트/백엔드/DB)으로 차단하는 방어 조치를 완료했습니다.

---

## 🛡️ 방어 설계 및 적용 내용

### 1. 백엔드(Server-Side) 필터링 보호
- **기존 방식**: 클라이언트 컴포넌트(`ProfileSetupPage`)에서 `supabase-js` 클라이언트를 이용해 `profiles` 테이블에 직접 `upsert` 요청을 보냄으로써 클라이언트 조작에 취약했습니다.
- **수정 방식**: `app/profile-setup/actions.ts`에 **보안 서버 액션(Server Action)**인 `updateProfile`을 작성하고, 프로필 수정 시 이를 호출하도록 이식했습니다.
  - 클라이언트가 어떠한 `role` 값을 전송하더라도, 서버 액션 내부에서 현재 세션의 실제 등급이 `admin`인지 검증하여 비인가된 `role` 업데이트는 원천 배제(Ignore)하고 화이트리스트 컬럼만 반영합니다.

### 2. 데이터베이스(DB Trigger) 레벨 2차 장벽
- 비인가자가 API 패킷을 우회하여 Supabase REST API로 직접 `profiles` 테이블의 `role` 이나 `is_admin` 컬럼 업데이트를 시도하는 상황을 차단하기 위해 **DB BEFORE UPDATE 트리거**를 신설했습니다.
- 트리거 함수는 요청 세션(`auth.uid()`)의 기존 등급이 최고관리자가 아닐 경우, `role` 및 `is_admin` 컬럼의 변경 시도가 있더라도 강제로 이전 데이터(`OLD.role`, `OLD.is_admin`)로 덮어써서 롤백합니다.

---

## 🛠️ DB 트리거 적용 방법 (Supabase Dashboard)

이전 공지사항 테이블 생성과 마찬가지로, 원격 Supabase 인스턴스에 DB 트리거를 반영해야 합니다.

1. [Supabase SQL Editor](https://supabase.com/dashboard/project/ywigqnwtdyrvchsdnlyw/editor)에 접속합니다.
2. **New Query** 버튼을 눌러 아래의 쿼리를 입력하고 **Run**을 실행합니다.

```sql
-- 1. 권한 변경 시도를 감지하여 차단하는 트리거 함수 정의
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 신규 회원가입(INSERT) 시에는 검사를 생략하고 허용
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- 업데이트 요청자가 최고관리자(is_admin = true)가 아닌 경우
  -- role 이나 is_admin 의 수정을 시도하면 강제로 이전 값으로 고정
  IF NOT (
    SELECT COALESCE(is_admin, false) 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) THEN
    NEW.role := OLD.role;
    NEW.is_admin := OLD.is_admin;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. profiles 테이블에 트리거 적용
DROP TRIGGER IF EXISTS tr_prevent_role_change ON public.profiles;
CREATE TRIGGER tr_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_change();
```
