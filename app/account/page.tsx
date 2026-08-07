import type { Metadata } from "next";
import AccountSettingsClient from "@/components/account-settings-client";

export const metadata: Metadata = {
  title: "Account Settings | GreenCat777",
};

export default function AccountSettingsPage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-16">
      <AccountSettingsClient />
    </div>
  );
}
