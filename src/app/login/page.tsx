import AuthButtons from "@/components/auth-buttons";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">로그인 / Login</h1>
      <p className="text-sm text-stone-600">
        구글 또는 카카오로 간편하게 시작할 수 있습니다.
        <br />
        Continue with Google or Kakao.
      </p>
      <AuthButtons />
    </div>
  );
}
