import Image from "next/image";

import { ConvexClientProvider } from "@/app/ConvexClientProvider";

import LoginActions from "./LoginActions";

const HERO_IMAGE = "/1.jpg";

export default function LoginPage() {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#040506]">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Mountain landscape behind Gather login"
          fill
          priority
          fetchPriority="high"
          className="object-cover"
        />
        <div className="login-hero-overlay absolute inset-0" />
        <div className="login-hero-glow absolute inset-0" />
      </div>

      <main className="relative z-10 flex min-h-full flex-col">
        <div className="flex flex-1 flex-col justify-end lg:px-10 lg:pb-10 xl:px-14">
          <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end lg:grid lg:grid-cols-[minmax(0,1.15fr)_26rem] lg:items-end lg:gap-10">
            <section className="px-5 pb-8 pt-8 md:px-6 md:pb-10 md:pt-10 lg:px-0 lg:pb-14 lg:pt-14">
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
              <div className="lg:flex lg:flex-col lg:justify-end">
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/52">
                    Sign in
                  </p>
                  <p className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white">
                    One shared notebook for places, dates, votes, and bookings.
                  </p>
                </div>

                <ConvexClientProvider>
                  <LoginActions />
                </ConvexClientProvider>

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
