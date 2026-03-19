"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut, Plus } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const { signOut } = useAuthActions();

  return (
    <nav className="fixed top-0 z-50 w-full bg-black/50 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-360 items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-serif text-2xl tracking-widest text-white group-hover:opacity-70 transition-opacity">
            GATHER
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <button
            onClick={() => void signOut()}
            className="text-gray-400 hover:text-white transition-colors duration-300 uppercase tracking-widest text-xs font-light"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
