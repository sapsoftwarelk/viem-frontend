import UserLayoutWrapper from "@/components/user/UserLayoutWrapper";
import AuthGuard from "@/components/auth/AuthGuard";

export default function UserSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <UserLayoutWrapper>{children}</UserLayoutWrapper>
    </AuthGuard>
  );
}
