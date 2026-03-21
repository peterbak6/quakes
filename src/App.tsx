import { useState } from "react";
import MapView from "./Map";
import NavPanel from "./NavPanel";
import { useEarthquakes } from "./hooks/useEarthquakes";
import type { QuakeParams } from "./hooks/useEarthquakes";

const DEFAULT_PARAMS: QuakeParams = {
  starttime: "2016-01-01",
  minmagnitude: 3.5,
  minlatitude: 28.0,
  maxlatitude: 36.5,
  minlongitude: 32.0,
  maxlongitude: 38.0,
};

export default function App() {
  const [draft, setDraft] = useState<QuakeParams>(DEFAULT_PARAMS);
  const [committed, setCommitted] = useState<QuakeParams>(DEFAULT_PARAMS);
  const [sizeFactor, setSizeFactor] = useState(1);
  const { quakes, loading, error, count } = useEarthquakes(committed);

  const bbox = {
    minLat: draft.minlatitude,
    maxLat: draft.maxlatitude,
    minLon: draft.minlongitude,
    maxLon: draft.maxlongitude,
  };

  return (
    <div className="app">
      <MapView
        quakes={quakes}
        bbox={bbox}
        sizeFactor={sizeFactor}
        onBboxChange={(newBbox) =>
          setDraft((d) => ({
            ...d,
            minlatitude: newBbox.minLat,
            maxlatitude: newBbox.maxLat,
            minlongitude: newBbox.minLon,
            maxlongitude: newBbox.maxLon,
          }))
        }
      />
      <NavPanel
        params={draft}
        onChange={setDraft}
        onFetch={() => setCommitted(draft)}
        loading={loading}
        count={count}
        error={error}
        sizeFactor={sizeFactor}
        onSizeFactorChange={setSizeFactor}
      />
    </div>
  );
}
