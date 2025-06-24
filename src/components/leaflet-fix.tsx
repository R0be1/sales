'use client';

import { useEffect } from 'react';
import L from 'leaflet';

// This is a workaround for a known issue with Leaflet and Next.js
// where icons do not appear correctly. By moving this to a dedicated
// component that runs once in the root layout, we avoid repeated
// global modifications that can cause instability.
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

export function LeafletFix() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl.src,
      iconUrl: iconUrl.src,
      shadowUrl: shadowUrl.src,
    });
  }, []);

  return null;
}
