import type { Metadata } from "next";
import AdminClient from "@/components/admin-client";

export const metadata: Metadata = {
  title: "Admin | GreenCat777",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-16 pt-8">
      <AdminClient />
    </div>
  );
}
