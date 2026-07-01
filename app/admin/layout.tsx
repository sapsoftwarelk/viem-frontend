import AdminLayout from "@/components/admin/AdminLayout";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard adminOnly fallbackRoute="/user">
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  );
}
