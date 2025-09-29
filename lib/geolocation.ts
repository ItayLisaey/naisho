import { z } from "zod";

const GeolocationResponseSchema = z.object({
  ip: z.string(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export type GeolocationResponse = z.infer<typeof GeolocationResponseSchema>;

export async function getGeolocation(ip: string): Promise<GeolocationResponse> {
  const response = await fetch(`https://ipapi.co/${ip}/json/`);

  if (!response.ok) {
    throw new Error("Failed to fetch geolocation");
  }

  const data = await response.json();
  return GeolocationResponseSchema.parse({
    ip: data.ip,
    city: data.city,
    country: data.country_name,
  });
}

export function extractIpFromCandidate(
  candidate: RTCIceCandidate,
): string | null {
  const parts = candidate.candidate.split(" ");

  // ICE candidate format: "candidate:... typ srflx raddr ... rport ... "
  // We want the IP at index 4 (0-indexed)
  if (parts.length > 4 && parts[7] === "srflx") {
    return parts[4];
  }

  // Fallback to host candidate
  if (parts.length > 4 && parts[7] === "host") {
    return parts[4];
  }

  return null;
}
