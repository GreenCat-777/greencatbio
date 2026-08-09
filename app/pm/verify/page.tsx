import { Suspense } from "react";
import type { Metadata } from "next";
import VerifyAccountClient from "@/components/verify-account-client";

export const metadata: Metadata = {
  title: "Verify Account | GreenCat777",
};

export default function VerifyAccountPage() {
  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <Suspense fallback={<p className="text-center text-[#0ed145]/50 font-mono">loading...</p>}>
        <VerifyAccountClient />
      </Suspense>
    </div>
  );
}
