"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { useSpring, useMotionValue } from "motion/react";
import Image from "next/image";
import { Plus } from "lucide-react";

type Trip = {
  _id: string;
  title: string;
  destination: string;
  coverUrl?: string;
  lat?: number;
  lng?: number;
};

// Trip template for empty state
const TRIP_TEMPLATES: Trip[] = [
  { _id: "tpl-1", title: "Paris", destination: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { _id: "tpl-2", title: "Tokyo", destination: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { _id: "tpl-3", title: "Bali", destination: "Bali, Indonesia", lat: -8.4095, lng: 115.1889 },
  { _id: "tpl-4", title: "New York", destination: "New York, USA", lat: 40.7128, lng: -74.0060 },
  { _id: "tpl-5", title: "Cape Town", destination: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241 },
];



export default function Globe({
  trips = [],
  onAddTrip,
}: {
  trips?: Trip[],
  onAddTrip?: (destination: string, lat: number, lng: number) => void
}) {
  const isTemplateMode = trips.length === 0;
  const displayTrips = isTemplateMode ? TRIP_TEMPLATES : trips;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const pointerInteractionMovement = useRef({ x: 0, y: 0 });

  const rPhi = useMotionValue(0);
  const rsPhi = useSpring(rPhi, {
    stiffness: 280,
    damping: 40,
    mass: 1,
  });

  const rTheta = useMotionValue(0);
  const rsTheta = useSpring(rTheta, {
    stiffness: 120,
    damping: 40,
    mass: 1,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    let width = canvasRef.current.offsetWidth;
    const dpr = Math.min(
      window.devicePixelRatio ?? 1,
      window.innerWidth < 640 ? 1.8 : 2,
    );

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: dpr,
      width: width,
      height: width,
      phi: 0,
      theta: 0.25,
      dark: 0.05, // Dark theme fits naturally
      diffuse: 2.5,
      mapSamples: 40000,
      markerElevation: 0,
      mapBrightness: 8, // Bright dots
      baseColor: [0.94, 0.93, 0.91], // Neutral dark grey sphere
      markerColor: [1, 1, 1], // White dot markers
      glowColor: [0.94, 0.93, 0.91], // NO GLOW - prevents square box boundary shadows on varying backgrounds
      markers: displayTrips
        .filter((t) => t.lat && t.lng)
        .map((t) => ({
          location: [t.lat!, t.lng!],
          size: 0.015, // Reduced marker size acts as an earlier horizon threshold
          id: `trip-${t._id}`,
        })),
    });

    // Auto-rotate logic + spring physics
    let phi = 0;
    let baseTheta = 0.25;
    let rafId: number;
    const animate = () => {
      // Small auto-rotation + the dragged rotation
      phi += 0.003;
      globe.update({
        phi: phi + rsPhi.get(),
        theta: baseTheta + rsTheta.get()
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    // Handle resize
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
        globe.update({
          width: width,
          height: width,
        });
      }
    };
    window.addEventListener("resize", onResize);

    // Fade in
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1";
      }
    }, 50);

    return () => {
      cancelAnimationFrame(rafId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [trips, rsPhi, rsTheta]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-150 ">
      <canvas
        ref={canvasRef}
        className="block cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          pointerInteracting.current = {
            x: e.clientX - pointerInteractionMovement.current.x,
            y: e.clientY - pointerInteractionMovement.current.y
          };
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          rTheta.set(0);
          pointerInteractionMovement.current.y = 0;
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          rTheta.set(0);
          pointerInteractionMovement.current.y = 0;
        }}
        onPointerMove={(e) => {
          if (pointerInteracting.current !== null) {
            const deltaX = e.clientX - pointerInteracting.current.x;
            const deltaY = e.clientY - pointerInteracting.current.y;
            pointerInteractionMovement.current = { x: deltaX, y: deltaY };
            rPhi.set(deltaX / 200);
            rTheta.set(deltaY / 200);
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          opacity: 0,
          transition: "opacity 1.2s ease",
        }}
      />

      {/* HTML Markers via CSS Anchors */}
      {displayTrips.filter((t) => t.lat && t.lng).map((trip, i, validTrips) => {
        const cover = trip.coverUrl ?? '/covers/fallback.png'
        const shortName = trip.destination.split(',')[0].trim();

        // Smart Overlap Scale: distance check to nearby trips
        let minDistance = Infinity;
        validTrips.forEach((other, j) => {
          if (i !== j) {
            const dist = Math.sqrt(
              Math.pow((trip.lat!) - (other.lat!), 2) + Math.pow((trip.lng!) - (other.lng!), 2)
            );
            if (dist < minDistance) minDistance = dist;
          }
        });

        

        return (
          <div
            key={trip._id}
            className="absolute z-10 hover:z-60 transform -translate-x-1/2  pointer-events-none"
            style={{
              // @ts-ignore - positionAnchor is valid CSS but TS DOM types might lag
              positionAnchor: `--cobe-trip-${trip._id}`,
              bottom: "anchor(top)",
              left: "anchor(center)",
              opacity: `var(--cobe-visible-trip-${trip._id}, 0)`,
              filter: `blur(calc((1 - var(--cobe-visible-trip-${trip._id}, 0)) * 8px))`,
              transition: "opacity 0.3s, filter 0.3s, z-index 0.1s",
            }}
          >
            <div
              className="w-18 bg-white pt-1.5  px-1.5 rounded shadow-[0_2px_8px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-300 origin-bottom"
              
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
                e.currentTarget.style.zIndex = "49";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)";
                e.currentTarget.style.zIndex = "1";
              }}
            >
              <div className=" overflow-hidden bg-gray-100 rounded aspect-square" >
                {isTemplateMode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAddTrip?.(trip.destination, trip.lat!, trip.lng!);
                    }}
                    className="flex h-full w-full items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-accent transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                ) : (
                  <Image
                    src={cover}
                    alt={trip.title}
                    width={96}
                    height={96}
                      className="object-cover w-full h-full aspect-square"
                  />
                )}
              </div>

              <span
                className="block w-full py-1 overflow-hidden text-ellipsis whitespace-nowrap text-center font-sans text-[0.6rem] tracking-[0.02em] text-[#333] "
              >
                {shortName}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
