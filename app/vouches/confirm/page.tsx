import { Suspense } from "react";
import type { Metadata } from "next";
import ConfirmVouchClient from "@/components/confirm-vouch-client";

export const metadata: Metadata = {
  title: "Confirm Vouch | GreenCat777",
};

export default function ConfirmPage() {
  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <Suspense fallback={<p className="text-center text-[#0ed145]/50 font-mono">loading...</p>}>
        <ConfirmVouchClient />
      </Suspense>
    </div>
  );
}
