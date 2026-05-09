import Comments from "@/components/Comments";
import type { Metadata } from "next"
import SocialClient from "@/components/social-client"

export const metadata: Metadata = {
  title: "Social | GreenCat777",
  description: "Get in touch with GreenCat777 via Matrix, Email, or Discord.",
}

export default function SocialPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-16 space-y-10">
      <SocialClient />
      <Comments />
    </div>
  );
}
