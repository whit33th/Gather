"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTripPage = pathname.startsWith("/trip/");

  if (isTripPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-3 sm:pt-5">{children}</main>
    </>
  );
}
