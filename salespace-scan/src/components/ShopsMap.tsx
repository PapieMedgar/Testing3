import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Shop } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// This is needed because the default icons use relative paths that don't work in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface ShopsMapProps {
  shops: Shop[];
  isLoading: boolean;
}

const ShopsMap: React.FC<ShopsMapProps> = ({ shops, isLoading }) => {
  // South Africa's approximate center coordinates
  const southAfricaCenter = [-30.5595, 22.9375];
  const defaultZoom = 5;
  
  // Add global CSS to fix z-index issues with Leaflet and dialogs
  // This ensures dialogs appear above the map
  useEffect(() => {
    // Add a style element to the document head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      /* Fix z-index issues with Leaflet */
      .leaflet-pane,
      .leaflet-map-pane,
      .leaflet-tile,
      .leaflet-marker-icon,
      .leaflet-marker-shadow,
      .leaflet-tile-container,
      .leaflet-pane > svg,
      .leaflet-pane > canvas,
      .leaflet-zoom-box,
      .leaflet-image-layer,
      .leaflet-layer {
        z-index: 1 !important;
      }
      .leaflet-control {
        z-index: 2 !important;
      }
      .leaflet-popup {
        z-index: 3 !important;
      }
      
      /* Ensure dialogs are above the map */
      [role="dialog"] {
        z-index: 50 !important;
      }
    `;
    document.head.appendChild(styleElement);

    // Clean up function to remove the style element when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shop Locations</CardTitle>
          <CardDescription>Loading map data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!shops || shops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shop Locations</CardTitle>
          <CardDescription>No shops available to display on the map</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
          <MapPin className="h-12 w-12 mb-4" />
          <p>No shop locations found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Shop Locations</CardTitle>
          <CardDescription>
            Interactive map of all retail locations in South Africa
          </CardDescription>
        </div>
        <Navigation className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full rounded-md overflow-hidden border" style={{ position: 'relative', zIndex: 1 }}>
          <MapContainer 
            center={southAfricaCenter} 
            zoom={defaultZoom} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            // Set lower z-index to ensure dialogs appear above the map
            className="leaflet-container"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {shops.map((shop) => (
              <Marker 
                key={shop.id} 
                position={[shop.latitude, shop.longitude]}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-base">{shop.name}</h3>
                    <p className="text-sm">{shop.address}</p>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span>Shop ID: {shop.id}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopsMap;