import { Suspense } from "react";
import type { Metadata } from "next";
import ConfirmEmailChangeClient from "@/components/confirm-email-change-client";

export const metadata: Metadata = {
  title: "Confirm Email | GreenCat777",
};

export default function ConfirmEmailChangePage() {
  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <Suspense fallback={<p className="text-center text-[#0ed145]/50 font-mono">loading...</p>}>
        <ConfirmEmailChangeClient />
      </Suspense>
    </div>
  );
}
