import type { Metadata } from "next";
import KofiWallClient from "@/components/kofi-wall-client";

export const metadata: Metadata = {
  title: "Kindle Ko-fi Wall | GreenCat777",
  description: "Support Kindle modding community members — a directory of Ko-fi links.",
};

export default function KofiWallPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-16 space-y-10">
      <KofiWallClient />
    </div>
  );
}
