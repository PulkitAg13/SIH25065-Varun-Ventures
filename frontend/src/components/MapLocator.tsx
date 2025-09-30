import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvent } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

// Inline SVG-based red pin icon using DivIcon so we don't depend on external image assets
function useRedPinIcon() {
  return useMemo(() => {
    const svg = encodeURIComponent(
      `<?xml version="1.0" encoding="UTF-8"?><svg width="28" height="42" viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 41C14 41 26 27.912 26 18C26 8.611 20.075 1 14 1C7.925 1 2 8.611 2 18C2 27.912 14 41 14 41Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/><circle cx="14" cy="17" r="5" fill="white"/></svg>`
    );
    return L.divIcon({
      className: '',
      html: `<img alt="pin" src="data:image/svg+xml;utf8,${svg}" style="transform: translate(-50%, -100%);"/>`,
      iconSize: [28, 42],
      iconAnchor: [14, 42],
      popupAnchor: [0, -42],
    });
  }, []);
}

const EsriWorldImagery = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
};

function FlyTo({ center }: { center: LatLngExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      // Use instant setView without animation for perceived zero load time
      map.setView(center, Math.max(map.getZoom(), 16), { animate: false });
    }
  }, [center, map]);
  return null;
}

function ClickToSet({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvent('click', (e) => {
    onPick(e.latlng.lat, e.latlng.lng);
  });
  return null;
}

export interface MapLocatorProps {
  height?: number;
  onLocate?: (lat: number, lng: number) => void;
  // Controlled display position (when provided, component can be read-only)
  position?: LatLngExpression | null;
  // Toggle interactions (click/drag) and Locate Me button
  interactive?: boolean;
  showLocateButton?: boolean;
}

const MapLocator: React.FC<MapLocatorProps> = ({
  height = 220,
  onLocate,
  position: controlledPosition = null,
  interactive = true,
  showLocateButton = true,
}) => {
  const { toast } = useToast();
  const [internalPosition, setInternalPosition] = useState<LatLngExpression | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const redPin = useRedPinIcon();

  const displayPosition = controlledPosition ?? internalPosition;

  const handleLocate = () => {
    if (!('geolocation' in navigator)) {
      toast({ title: 'Geolocation not supported', description: 'Your browser does not support location services.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng: LatLngExpression = [latitude, longitude];
        setInternalPosition(latlng);
        onLocate?.(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        toast({ title: 'Unable to get location', description: err.message || 'Please allow location access and try again.', variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Type workaround: some setups show false positives on react-leaflet prop types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AnyMapContainer = MapContainer as unknown as React.FC<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AnyTileLayer = TileLayer as unknown as React.FC<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AnyMarker = Marker as unknown as React.FC<any>;

  return (
    <Card className="glass-card border-0">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {interactive && showLocateButton ? 'Satellite view — use "Locate Me" or click/drag pin' : 'Satellite view'}
          </p>
          {showLocateButton && interactive && (
            <Button size="sm" variant="water" onClick={handleLocate} disabled={loading}>
              {loading ? 'Locating…' : 'Locate Me'}
            </Button>
          )}
        </div>
        <div className="rounded-lg overflow-hidden shadow-soft border border-border">
          <AnyMapContainer
            center={displayPosition || [20.5937, 78.9629]}
            zoom={displayPosition ? 16 : 5}
            scrollWheelZoom={false}
            preferCanvas={true}
            zoomAnimation={false}
            fadeAnimation={false}
            markerZoomAnimation={false}
            style={{ height }}
            whenCreated={(map) => (mapRef.current = map)}
          >
            <AnyTileLayer
              attribution={EsriWorldImagery.attribution}
              url={EsriWorldImagery.url}
              // Tune tile rendering to paint faster and reduce work during interactions
              updateWhenZooming={false}
              updateWhenIdle={true}
              keepBuffer={0}
              tileSize={256}
              detectRetina={false}
            />
            <FlyTo center={displayPosition} />
            {interactive && (
              <ClickToSet
                onPick={(lat, lng) => {
                  setInternalPosition([lat, lng]);
                  onLocate?.(lat, lng);
                }}
              />
            )}
            {displayPosition && (
              <AnyMarker
                position={displayPosition}
                icon={redPin}
                draggable={interactive}
                eventHandlers={
                  interactive
                    ? {
                        dragend: (e: L.LeafletEvent) => {
                          const m = e.target as L.Marker;
                          const p = m.getLatLng();
                          setInternalPosition([p.lat, p.lng]);
                          onLocate?.(p.lat, p.lng);
                        },
                      }
                    : undefined
                }
              />
            )}
          </AnyMapContainer>
        </div>
        {displayPosition && Array.isArray(displayPosition) && (
          <p className="mt-2 text-xs text-muted-foreground">
            Selected: {displayPosition[0].toFixed(6)}, {displayPosition[1].toFixed(6)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MapLocator;
