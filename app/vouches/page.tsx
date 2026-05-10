import type { Metadata } from "next";
import VouchesClient from "@/components/vouches-client";

export const metadata: Metadata = {
  title: "Vouches | GreenCat777",
  description: "Real vouches from people GreenCat777 has helped.",
};

export default function VouchesPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-16 space-y-10">
      <VouchesClient />
    </div>
  );
}
