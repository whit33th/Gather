"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Compass, Sparkles, Users } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuthActions();

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,218,198,0.9),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(255,244,228,0.85),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-card hidden rounded-[2.5rem] p-10 lg:flex lg:flex-col"
          >
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
              <span className="font-serif text-3xl tracking-[-0.05em] text-stone-950">Gather</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <div className="mt-16">
              <p className="section-kicker">Shared travel planning</p>
              <h1 className="balanced mt-4 font-serif text-6xl leading-[0.9] tracking-[-0.06em] text-stone-950">
                Plan the trip before it becomes forty messages.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-stone-600">
                Gather holds the map, the dates, the ideas, the costs, and the running chat in one bright place that feels closer to a notebook than a dashboard.
              </p>
            </div>

            <div className="mt-auto grid gap-4 sm:grid-cols-3">
              <div className="editorial-card-soft rounded-[1.7rem] p-5">
                <Compass className="h-5 w-5 text-[#dd5a3d]" />
                <p className="mt-4 section-kicker text-[0.58rem]">Map and weather</p>
              </div>
              <div className="editorial-card-soft rounded-[1.7rem] p-5">
                <Users className="h-5 w-5 text-[#5a7e67]" />
                <p className="mt-4 section-kicker text-[0.58rem]">Votes and availability</p>
              </div>
              <div className="editorial-card-soft rounded-[1.7rem] p-5">
                <Sparkles className="h-5 w-5 text-[#977540]" />
                <p className="mt-4 section-kicker text-[0.58rem]">Cover images and gallery</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-card w-full rounded-[2.2rem] p-6 shadow-[0_32px_90px_rgba(96,58,30,0.16)] sm:p-8"
          >
            <div className="lg:hidden">
              <Link href="/" className="font-serif text-4xl tracking-[-0.06em] text-stone-950">
                Gather
              </Link>
            </div>

            <div className="mt-2 lg:mt-0">
              <p className="section-kicker">Sign in</p>
              <h2 className="balanced mt-3 font-serif text-4xl leading-[0.94] tracking-[-0.05em] text-stone-950 sm:text-5xl">
                Join the trip notebook.
              </h2>
              <p className="mt-3 text-sm text-stone-600 sm:text-base">
                Use Google for your main account, or create a temporary anonymous session to try the full flow.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={() => void signIn("google", { redirectTo: "/" })}
                className="editorial-button-secondary flex w-full items-center justify-between rounded-[1.3rem] px-5 py-4 text-[0.68rem]"
              >
                <span className="flex items-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-stone-900/10" />
                <span className="section-kicker text-[0.56rem]">or</span>
                <div className="h-px flex-1 bg-stone-900/10" />
              </div>

              <button
                onClick={() =>
                  void signIn("password", {
                    redirectTo: "/",
                    flow: "signUp",
                    password: "testuser",
                    email: `test_${Math.random().toString(36).slice(2, 7)}@example.com`,
                  })
                }
                className="editorial-button-primary flex w-full items-center justify-between rounded-[1.3rem] px-5 py-4 text-[0.68rem]"
              >
                Sign in anonymously
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-stone-900/8 bg-white/62 p-5">
              <p className="section-kicker text-[0.58rem]">What you get</p>
              <p className="mt-3 text-sm text-stone-600">
                Shared destinations, actual trip dates, proposal voting, budget tracking, chat, gallery uploads, and a calmer way to coordinate the group.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
