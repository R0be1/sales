
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

// Component to handle map click events
function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
}

const LeadMap = ({ lat, lng, onMapClick }: LeadMapProps) => {
    const [initialCenter] = useState<[number, number]>([lat, lng]);
    const position: [number, number] = [lat, lng];
    const mapRef = useRef<L.Map | null>(null);

    // Workaround for a known issue with Leaflet icons in Next.js
    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: iconRetinaUrl.src,
            iconUrl: iconUrl.src,
            shadowUrl: shadowUrl.src,
        });
    }, []);

    // Effect to update map view when position prop changes
    useEffect(() => {
        if (mapRef.current) {
            // Check if the view needs to be updated to avoid unnecessary calls
            const currentCenter = mapRef.current.getCenter();
            if (currentCenter.lat !== position[0] || currentCenter.lng !== position[1]) {
                mapRef.current.setView(position, mapRef.current.getZoom());
            }
        }
    }, [position]);
    
    const mapStyle = useMemo(() => ({ height: '100%', width: '100%', borderRadius: 'inherit' }), []);

    return (
        <MapContainer 
            center={initialCenter} 
            zoom={12} 
            style={mapStyle}
            ref={mapRef}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position} />
            <MapEvents onMapClick={onMapClick} />
        </MapContainer>
    );
};

export default LeadMap;
