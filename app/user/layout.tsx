import UserLayoutWrapper from "@/components/user/UserLayoutWrapper";

export default function UserSectionLayout({ children }: { children: React.ReactNode }) {
  return <UserLayoutWrapper>{children}</UserLayoutWrapper>;
}
