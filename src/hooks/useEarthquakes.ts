import { useState, useEffect } from "react";

export interface QuakeParams {
  starttime: string;
  minmagnitude: number;
  minlatitude: number;
  maxlatitude: number;
  minlongitude: number;
  maxlongitude: number;
}

export interface Quake {
  magnitude: number;
  location: string;
  time: string;
  url: string;
  coords: [number, number, number];
  data: any; // for any additional properties from the API
}

const USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

export function useEarthquakes(params: QuakeParams) {
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const urlParams = new URLSearchParams({
      format: "geojson",
      starttime: params.starttime,
      minlatitude: String(params.minlatitude),
      maxlatitude: String(params.maxlatitude),
      minlongitude: String(params.minlongitude),
      maxlongitude: String(params.maxlongitude),
      minmagnitude: String(params.minmagnitude),
    });

    fetch(`${USGS_URL}?${urlParams}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        console.log(`Found ${data.metadata.count} earthquakes in the region.`);
        setCount(data.metadata.count);
        setQuakes(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.features.map((f: any) => ({
            magnitude: f.properties.mag,
            location: f.properties.place,
            time: new Date(f.properties.time).toLocaleString(),
            url: f.properties.url,
            coords: f.geometry.coordinates as [number, number, number],
            data: f.properties, // store all additional properties from the API
          })),
        );
      })
      .catch((e) => {
        if (!cancelled) setError(String(e.message));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    params.starttime,
    params.minlatitude,
    params.maxlatitude,
    params.minlongitude,
    params.maxlongitude,
    params.minmagnitude,
  ]);

  return { quakes, loading, error, count };
}
