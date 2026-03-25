import { useState, useEffect } from "react";
import MapView from "./Map";
import NavPanel from "./NavPanel";
import ScaleLegend from "./ScaleLegend";
import { useEarthquakes } from "./hooks/useEarthquakes";
import type { QuakeParams, RadiusParams } from "./util";
import { DEFAULT_RADIUS_PARAMS, loadStoredParams } from "./util";

export default function App() {
  const [pendingParams, setPendingParams] =
    useState<QuakeParams>(loadStoredParams);
  const [activeParams, setActiveParams] =
    useState<QuakeParams>(loadStoredParams);
  const [radiusParams, setRadiusParams] = useState<RadiusParams>(
    DEFAULT_RADIUS_PARAMS,
  );

  useEffect(() => {
    localStorage.setItem("quakeDraftParams", JSON.stringify(pendingParams));
  }, [pendingParams]);

  const { quakes, loading, error, count } = useEarthquakes(activeParams);

  return (
    <div className="app">
      <MapView
        quakes={quakes}
        bbox={{
          minLat: pendingParams.minlatitude,
          maxLat: pendingParams.maxlatitude,
          minLon: pendingParams.minlongitude,
          maxLon: pendingParams.maxlongitude,
        }}
        radiusParams={radiusParams}
        loading={loading}
        onBboxChange={(newBbox) =>
          setPendingParams((d) => ({
            ...d,
            minlatitude: newBbox.minLat,
            maxlatitude: newBbox.maxLat,
            minlongitude: newBbox.minLon,
            maxlongitude: newBbox.maxLon,
          }))
        }
        onViewStateChange={() => {}}
      />
      <ScaleLegend radiusParams={radiusParams} />
      <NavPanel
        params={pendingParams}
        onChange={setPendingParams}
        onFetch={() => setActiveParams(pendingParams)}
        loading={loading}
        count={count}
        error={error}
        radiusParams={radiusParams}
        onRadiusParamsChange={setRadiusParams}
      />
    </div>
  );
}
