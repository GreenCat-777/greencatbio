import type { Metadata } from "next";
import ResetPasswordClient from "@/components/reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password | GreenCat777",
};

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 pb-16">
      <ResetPasswordClient />
    </div>
  );
}
