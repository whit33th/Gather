"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  SunMedium,
} from "lucide-react";

type WeatherDaily = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
};

type WeatherCurrent = {
  temperature_2m: number;
  wind_speed_10m: number;
  weather_code: number;
};

type WeatherResponse = {
  current: WeatherCurrent;
  daily: WeatherDaily;
};

function codeToLabel(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloud cover";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 86) return "Showers";
  if (code <= 99) return "Thunderstorm";
  return "Cloudy";
}

function getWeatherTheme(code: number) {
  if (code === 0) {
    return {
      shell: "from-[#d9edff] via-[#eef7ff] to-[#fff9ef]",
      tint: "bg-[#eef7ff]/76",
      orb: "bg-[#fff0b4]",
      accent: "text-[#3d6798]",
      icon: <SunMedium className="h-14 w-14" strokeWidth={1.7} />,
    };
  }

  if (code <= 3) {
    return {
      shell: "from-[#dbe8f7] via-[#eef5fb] to-[#faf4ec]",
      tint: "bg-[#f4f7fb]/74",
      orb: "bg-[#f8ecc7]",
      accent: "text-[#58718f]",
      icon: <CloudSun className="h-14 w-14" strokeWidth={1.7} />,
    };
  }

  if (code <= 48) {
    return {
      shell: "from-[#e4e8ed] via-[#f2f4f7] to-[#faf8f3]",
      tint: "bg-white/72",
      orb: "bg-[#dfe5eb]",
      accent: "text-[#6a7584]",
      icon: <CloudFog className="h-14 w-14" strokeWidth={1.7} />,
    };
  }

  if (code <= 67 || code <= 82) {
    return {
      shell: "from-[#d8e3f1] via-[#ebf1f7] to-[#f8f4ef]",
      tint: "bg-[#f2f6fa]/74",
      orb: "bg-[#cedaea]",
      accent: "text-[#587090]",
      icon: <CloudRain className="h-14 w-14" strokeWidth={1.7} />,
    };
  }

  if (code <= 86) {
    return {
      shell: "from-[#e7edf5] via-[#f3f7fb] to-[#fdfcff]",
      tint: "bg-white/76",
      orb: "bg-[#edf3fa]",
      accent: "text-[#7088a6]",
      icon: <CloudSnow className="h-14 w-14" strokeWidth={1.7} />,
    };
  }

  if (code <= 99) {
    return {
      shell: "from-[#dde2ea] via-[#edf1f6] to-[#f8f2ee]",
      tint: "bg-[#f3f4f7]/74",
      orb: "bg-[#d9dee7]",
      accent: "text-[#616a79]",
      icon: <CloudLightning className="h-14 w-14" strokeWidth={1.7} />,
    };
  }

  return {
    shell: "from-[#e5e9ee] via-[#f2f4f7] to-[#faf8f4]",
    tint: "bg-white/74",
    orb: "bg-[#dfe3e8]",
    accent: "text-[#68717d]",
    icon: <Cloud className="h-14 w-14" strokeWidth={1.7} />,
  };
}

export default function WeatherCard({
  lat,
  lng,
  location,
}: {
  lat?: number;
  lng?: number;
  location?: string;
}) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setError(null);
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&current=temperature_2m,weather_code,wind_speed_10m` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error("Weather fetch failed");
        }
        const json = (await res.json()) as WeatherResponse;
        setData(json);
      } catch (err: unknown) {
        if (!(err instanceof Error) || err.name !== "AbortError") {
          setError("Weather unavailable");
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [lat, lng]);

  const theme = useMemo(
    () => (data ? getWeatherTheme(data.current.weather_code) : null),
    [data]
  );

  if (lat == null || lng == null) {
    return (
      <div className="rounded-[1.8rem] border border-white/10 bg-[#171717] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <p className="section-kicker">Weather</p>
        <p className="mt-2 text-sm text-white/56">
          Add a destination with coordinates to see the forecast.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#171717] text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      {theme ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_20%)]" />
          <div className="absolute right-6 top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        </>
      ) : null}

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-kicker">Weather</p>
            <p className="mt-2 text-sm text-white/58">{location || "Current location"}</p>
          </div>

          {data && theme ? (
            <div className="flex items-center gap-4 sm:text-right">
              <div
                className="hidden h-24 w-24 items-center justify-center rounded-[2rem] bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_20px_40px_rgba(0,0,0,0.18)] sm:flex"
              >
                {theme.icon}
              </div>
              <div>
                <p className="editorial-metric text-4xl text-white">
                  {Math.round(data.current.temperature_2m)}°
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">
                  {codeToLabel(data.current.weather_code)} / {Math.round(data.current.wind_speed_10m)} kmh wind
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {!data && !error ? (
          <div className="mt-5 h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900/60" />
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        {data ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {data.daily.time.slice(0, 5).map((day, index) => {
              return (
                <div
                  key={day}
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-3 text-center shadow-[0_10px_22px_rgba(0,0,0,0.16)] backdrop-blur-sm"
                >
                  <p className="section-kicker text-[0.58rem]">{format(new Date(day), "EEE")}</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {Math.round(data.daily.temperature_2m_max[index])} / {Math.round(data.daily.temperature_2m_min[index])}
                  </p>
                  <p className="mt-1 text-xs text-white/46">
                    {codeToLabel(data.daily.weather_code[index])}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
