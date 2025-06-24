
'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// This is a workaround for a known issue with Leaflet and Next.js
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface LeadMapProps {
    lat: number;
    lng: number;
    onMapClick: (latlng: L.LatLng) => void;
}

// This child component handles all map updates and events.
// It is defined outside the main component to prevent re-creation on every render.
function MapController({ lat, lng, onMapClick }: LeadMapProps) {
    const map = useMap();

    // Effect to update map view when lat/lng props change from parent
    useEffect(() => {
        const currentCenter = map.getCenter();
        if (currentCenter.lat !== lat || currentCenter.lng !== lng) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    
    // Hook to handle map click events
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });

    return null; // This component does not render anything to the DOM
}

const LeadMap = ({ lat, lng, onMapClick }: LeadMapProps) => {
    // Only use the initial lat/lng for the MapContainer's center prop.
    // Subsequent updates are handled by the MapController component.
    const [initialCenter] = useState<[number, number]>([lat, lng]);
    const position: [number, number] = [lat, lng];

    // Workaround for a known issue with Leaflet icons in Next.js
    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: iconRetinaUrl.src,
            iconUrl: iconUrl.src,
            shadowUrl: shadowUrl.src,
        });
    }, []);
    
    const mapStyle = useMemo(() => ({ height: '100%', width: '100%', borderRadius: 'inherit' }), []);

    return (
        <MapContainer 
            center={initialCenter} 
            zoom={12} 
            style={mapStyle}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* The Marker's position will update on re-render */}
            <Marker position={position} />
            {/* The MapController handles events and view changes */}
            <MapController lat={lat} lng={lng} onMapClick={onMapClick} />
        </MapContainer>
    );
};

export default LeadMap;
