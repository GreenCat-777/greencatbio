import NotFoundClient from "@/components/not-found-client"

export const metadata = {
  title: "404 | Page Not Found",
  description: "You weren't supposed to find this… wanna play Snake?",
  openGraph: {
    title: "404 | Page Doesn't Exist",
    description: "You weren't supposed to find this… wanna play Snake?",
    images: ["/embed-404.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "404 | Page Doesn't Exist",
    description: "You weren't supposed to find this… wanna play Snake?",
    images: ["/embed-404.png"],
  },
}

export default function NotFound() {
  return <NotFoundClient />
}
