"use client";

import { useAuthActions } from "@convex-dev/auth/react";

import { GoogleIcon } from "@/components/icons/GoogleIcon";

export default function LoginActions() {
  const { signIn } = useAuthActions();

  return (
    <>
      <button
        type="button"
        onClick={() => void signIn("google", { redirectTo: "/" })}
        className="mt-0 flex min-h-16 w-full items-center justify-center gap-3 rounded-full border border-black/8 bg-white px-6 text-[1.1rem] font-bold tracking-[-0.03em] text-[#171717] shadow-[0_14px_30px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#f8f8f8] lg:mt-10"
      >
        <GoogleIcon />
        <span>Sign in with Google</span>
      </button>

      <button
        type="button"
        onClick={() =>
          void signIn("password", {
            redirectTo: "/",
            flow: "signUp",
            password: "testuser",
            email: `test_${Math.random().toString(36).slice(2, 7)}@example.com`,
          })
        }
        className="mt-3 flex min-h-16 w-full items-center justify-center rounded-full border border-white/16 bg-white/10 px-6 text-[1.05rem] font-bold tracking-[-0.03em] text-white transition hover:-translate-y-0.5 hover:bg-white/14"
      >
        Sign in anonymously
      </button>
    </>
  );
}
