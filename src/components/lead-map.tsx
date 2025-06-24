'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
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

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
}

function ChangeView({ center, zoom }: {center: [number, number], zoom: number}) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom]);
    return null;
}

const LeadMap = ({ lat, lng, onMapClick }: LeadMapProps) => {
    // This useEffect is a workaround for a known issue with Leaflet icons in Next.js
    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: iconRetinaUrl.src,
            iconUrl: iconUrl.src,
            shadowUrl: shadowUrl.src,
        });
    }, []);

    // Store the initial center to prevent the MapContainer from re-rendering with a new center prop.
    const [initialCenter] = useState<[number, number]>([lat, lng]);
    const position: [number, number] = [lat, lng];

    return (
        <MapContainer center={initialCenter} zoom={12} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}>
            <ChangeView center={position} zoom={12} />
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
