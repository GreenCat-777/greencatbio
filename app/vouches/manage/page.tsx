import { Suspense } from "react";
import type { Metadata } from "next";
import ManageVouchClient from "@/components/manage-vouch-client";

export const metadata: Metadata = {
  title: "Manage Vouch | GreenCat777",
};

export default function ManageVouchPage() {
  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <Suspense fallback={<p className="text-center text-[#0ed145]/50 font-mono">loading...</p>}>
        <ManageVouchClient />
      </Suspense>
    </div>
  );
}
