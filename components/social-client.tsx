"use client"

import Link from "next/link"

export default function SocialClient() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[#0ed145]/30 bg-white dark:bg-[#0d0d0d] p-6 font-mono shadow-lg shadow-[#0ed145]/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#0ed145] glow-text">Social</h1>
          <Link
            href="/"
            className="px-4 py-2 rounded border border-[#0ed145] text-[#0ed145] bg-transparent font-mono text-sm button-glow hover:bg-[#0ed145]/10 transition-colors"
          >
            Home
          </Link>
        </div>

        <p className="text-[#0ed145]/80 text-sm mb-6">
          <span className="text-[#0ed145]">{"greencat777@bio:~$"}</span> cat socials.txt
        </p>

        <div className="flex flex-wrap gap-3 mb-8" style={{ animation: "fadeIn 0.5s ease-out" }}>
          <a
            href="https://matrix.to/#/@greencat777:matrix.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded border border-[#0ed145] text-[#0ed145] bg-transparent font-mono text-sm button-glow hover:bg-[#0ed145]/10 transition-colors"
          >
            Matrix
          </a>
          <a
            href="mailto:greencat777456@gmail.com"
            className="px-6 py-2 rounded border border-[#0ed145] text-[#0ed145] bg-transparent font-mono text-sm button-glow hover:bg-[#0ed145]/10 transition-colors"
          >
            Email
          </a>
          <a
            href="https://discord.com/users/902006605791494255"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded border border-[#0ed145] text-[#0ed145] bg-transparent font-mono text-sm button-glow hover:bg-[#0ed145]/10 transition-colors"
          >
            Discord
          </a>
        </div>

        <div className="rounded border border-[#0ed145]/20 bg-[#0ed145]/5 p-4">
          <p className="text-[#333] dark:text-[#d4d4d4] text-sm leading-relaxed">
            Discord is soon to be removed. I have a Stoat it is GreenCat777#4751
          </p>
        </div>
      </div>
    </main>
  )
}
