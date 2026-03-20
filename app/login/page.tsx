"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE = "/1.jpg";

function GoogleIcon() {
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

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-extrabold tracking-[-0.06em] text-black">
        G
      </span>
      <span className="text-xl font-extrabold tracking-[-0.04em] text-white">GATHER</span>
    </Link>
  );
}

export default function LoginPage() {
  const { signIn } = useAuthActions();

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#040506]">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Mountain landscape behind Gather login"
          fill
          priority
          fetchPriority="high"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,28,36,0.12)_0%,rgba(13,18,24,0.14)_22%,rgba(8,10,12,0.42)_56%,rgba(3,4,5,0.94)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,7,9,0.58)_0%,rgba(5,7,9,0.2)_34%,rgba(5,7,9,0.34)_62%,rgba(5,7,9,0.78)_100%),linear-gradient(180deg,rgba(20,28,36,0.08)_0%,rgba(7,8,10,0.3)_56%,rgba(3,4,5,0.86)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.06),transparent_42%)]" />
      </div>

      <main className="relative z-10 flex min-h-svh flex-col">
        <header className="px-5 pb-2 pt-[calc(1rem+env(safe-area-inset-top))] text-white md:px-6 lg:px-10 lg:pt-8 xl:px-14">
          <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between">
            <Brand />

            <Link
              href="/"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-white/30 bg-white/10 px-5 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/18"
            >
              Skip
            </Link>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-end lg:px-10 lg:pb-10 xl:px-14">
          <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end lg:grid lg:grid-cols-[minmax(0,1.15fr)_26rem] lg:items-end lg:gap-10">
            <section className="px-5 pb-8 md:px-6 md:pb-10 lg:px-0 lg:pb-14">
              <div className="max-w-[18rem] lg:max-w-[54rem]">
                <h1 className="text-[4rem] font-semibold leading-[0.9] tracking-[-0.08em] text-white sm:text-[4.5rem] lg:mt-5 lg:text-[clamp(5.4rem,9vw,8.8rem)] lg:leading-[0.88]">
                  The Journey Starts Here
                </h1>
                <p className="mt-8 text-[1.1rem] leading-7 text-white/80 lg:max-w-[34rem] lg:text-[1.45rem] lg:leading-8">
                  Plan trips from idea to booking
                </p>
              </div>
            </section>

            <section className="rounded-t-[2rem] bg-black px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:pb-9 lg:mb-14 lg:rounded-[2.25rem] lg:border lg:border-white/10 lg:bg-black/72 lg:p-7 lg:backdrop-blur-xl">
              <div className="lg:flex  lg:flex-col lg:justify-end">
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/52">
                    Sign in
                  </p>
                  <p className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white">
                    One shared notebook for places, dates, votes, and bookings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void signIn("google", { redirectTo: "/" })}
                  className="flex min-h-16 w-full  items-center justify-center gap-3 rounded-full border border-black/8 bg-white px-6 text-[1.1rem] font-bold tracking-[-0.03em] text-[#171717] shadow-[0_14px_30px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#f8f8f8] lg:mt-10"
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

                <p className="mx-auto mt-7 max-w-[20rem] text-center text-[0.92rem] leading-6 text-white/36 lg:mx-0 lg:max-w-none lg:text-left">
                  By continuing you agree to the Terms of Service and Privacy Policy
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
