
import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordClient from "@/components/reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password | GreenCat777",
};

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 pb-16">
      <Suspense fallback={null}>
        <ResetPasswordClient />
      </Suspense>
    </div>
  );
}
