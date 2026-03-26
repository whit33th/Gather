"use client";

import { useAuthActions } from "@convex-dev/auth/react";

export function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09A6.96 6.96 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
