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
      shell: "from-[#12231d] via-[#162c24] to-[#1d3329]",
      tint: "bg-[#152720]/80",
      orb: "bg-[#dbe887]/30",
      accent: "text-[#eef5d0]",
      icon: <SunMedium className="h-12 w-12" strokeWidth={1.7} />,
    };
  }

  if (code <= 3) {
    return {
      shell: "from-[#12231d] via-[#172a22] to-[#20342b]",
      tint: "bg-[#172921]/80",
      orb: "bg-[#cfd8cd]/20",
      accent: "text-[#dbe6cf]",
      icon: <CloudSun className="h-12 w-12" strokeWidth={1.7} />,
    };
  }

  if (code <= 48) {
    return {
      shell: "from-[#11201a] via-[#152720] to-[#1a2e25]",
      tint: "bg-[#172921]/84",
      orb: "bg-[#cfd8cd]/16",
      accent: "text-[#d7e1d3]",
      icon: <CloudFog className="h-12 w-12" strokeWidth={1.7} />,
    };
  }

  if (code <= 82) {
    return {
      shell: "from-[#10201a] via-[#162921] to-[#1b3127]",
      tint: "bg-[#162820]/84",
      orb: "bg-[#9fb0a3]/18",
      accent: "text-[#d7e1d3]",
      icon: <CloudRain className="h-12 w-12" strokeWidth={1.7} />,
    };
  }

  if (code <= 86) {
    return {
      shell: "from-[#10201a] via-[#152720] to-[#1a2e25]",
      tint: "bg-[#172921]/84",
      orb: "bg-[#cfd8cd]/16",
      accent: "text-[#d7e1d3]",
      icon: <CloudSnow className="h-12 w-12" strokeWidth={1.7} />,
    };
  }

  if (code <= 99) {
    return {
      shell: "from-[#0f1c17] via-[#152720] to-[#1a2d24]",
      tint: "bg-[#162820]/84",
      orb: "bg-[#d48d7a]/16",
      accent: "text-[#f3d0c5]",
      icon: <CloudLightning className="h-12 w-12" strokeWidth={1.7} />,
    };
  }

  return {
    shell: "from-[#10201a] via-[#152720] to-[#1a2e25]",
    tint: "bg-[#172921]/84",
    orb: "bg-[#cfd8cd]/16",
    accent: "text-[#d7e1d3]",
    icon: <Cloud className="h-12 w-12" strokeWidth={1.7} />,
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
      <div className="h-full rounded-[30px] border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <p className="section-kicker">Weather</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
          Forecast snapshot
        </h2>
        <p className="mt-3 text-sm text-[#a8b8ad]">
          Add a destination with coordinates to see the forecast.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[30px] border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] text-white shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
      {theme ? (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.shell}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(219,232,135,0.06),transparent_20%)]" />
          <div className={`absolute right-6 top-6 h-28 w-28 rounded-full ${theme.orb} blur-2xl`} />
        </>
      ) : null}

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-kicker">Weather</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Forecast snapshot
            </h2>
            <p className="mt-2 text-sm text-[#a8b8ad]">{location || "Current location"}</p>
          </div>

          {data && theme ? (
            <div className="flex items-center gap-4 sm:text-right">
              <div
                className={`hidden  aspect-square p-4 items-center justify-center rounded-[2rem] border border-[#31463c] ${theme.tint} ${theme.accent} shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_40px_rgba(0,0,0,0.16)] sm:flex`}
              >
                {theme.icon}
              </div>
              <div>
                <p className="editorial-metric text-4xl text-white">
                  {`${Math.round(data.current.temperature_2m)}°`}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#9fb0a3]">
                  {codeToLabel(data.current.weather_code)} / {Math.round(data.current.wind_speed_10m)} kmh wind
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {!data && !error ? (
          <div className="mt-5 h-5 w-5 animate-spin rounded-full border-2 border-[#627168] border-t-[#dbe887]" />
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        {data ? (
          <div className="mt-auto grid grid-cols-2 gap-3 pt-5 sm:grid-cols-5">
            {data.daily.time.slice(0, 5).map((day, index) => (
              <div
                key={day}
                className="rounded-[1.25rem] border border-[#23372e] bg-[#14251e] p-3 text-center shadow-[0_10px_22px_rgba(0,0,0,0.16)] backdrop-blur-sm"
              >
                <p className="section-kicker text-[0.58rem]">{format(new Date(day), "EEE")}</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {Math.round(data.daily.temperature_2m_max[index])} / {Math.round(data.daily.temperature_2m_min[index])}
                </p>
                <p className="mt-1 text-xs text-[#9fb0a3]">
                  {codeToLabel(data.daily.weather_code[index])}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
