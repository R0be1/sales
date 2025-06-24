
'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
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

// Component to handle map click events
function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
}

// This component runs inside the MapContainer's context and has access to the map instance.
// It repositions the map view when its `center` prop changes.
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}


const LeadMap = ({ lat, lng, onMapClick }: LeadMapProps) => {
    // This state is only used for the very first render to set the map's initial position.
    // It does not change afterward, which prevents the MapContainer from re-initializing.
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
