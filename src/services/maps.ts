/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

/**
 * Retrieves a shareable Google Maps link for the specified location.
 *
 * @param location The location to generate the Google Maps link for.
 * @returns A string containing the Google Maps link.
 */
export function getGoogleMapsLink(location: Location): string {
  // TODO: Implement this by calling an API.
  return `https://www.google.com/maps/place/${location.lat},${location.lng}`;
}
