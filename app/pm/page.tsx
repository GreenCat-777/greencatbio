import type { Metadata } from "next";
import PmClient from "@/components/pm-client";

export const metadata: Metadata = {
  title: "Private Messages | GreenCat777",
  description: "Sign in to send and receive private messages.",
};

export default function PmPage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-16">
      <PmClient />
    </div>
  );
}
