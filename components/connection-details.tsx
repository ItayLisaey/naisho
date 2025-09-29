"use client";

import { getGeolocation } from "@/lib/geolocation";
import { cn } from "@/lib/utils";
import type { WebRTCConnection } from "@/lib/webrtc";
import { useQuery } from "@tanstack/react-query";
import { Globe, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

interface ConnectionDetailsProps {
  connection?: WebRTCConnection;
  connectionState: RTCPeerConnectionState;
}

export function ConnectionDetails({
  connection,
  connectionState,
}: ConnectionDetailsProps) {
  const [peerIp, setPeerIp] = useState<string | null>(null);

  useEffect(() => {
    if (!connection || connectionState !== "connected") return;

    const getRemoteIp = async () => {
      try {
        const stats = await connection.connection.getStats();

        for (const report of stats.values()) {
          // Look for the active candidate pair
          if (
            report.type === "candidate-pair" &&
            report.state === "succeeded"
          ) {
            const remoteCandidate = stats.get(report.remoteCandidateId);

            if (remoteCandidate?.address) {
              const ip = remoteCandidate.address;
              // Skip local/private IPs
              if (
                !ip.startsWith("192.168.") &&
                !ip.startsWith("10.") &&
                !ip.startsWith("172.")
              ) {
                setPeerIp(ip);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to get remote IP:", error);
      }
    };

    getRemoteIp();

    // Poll for IP in case connection stats aren't immediately available
    const interval = setInterval(getRemoteIp, 1000);

    return () => clearInterval(interval);
  }, [connection, connectionState]);

  const { data: geoData, isLoading } = useQuery({
    queryKey: ["geolocation", peerIp],
    queryFn: () => {
      if (!peerIp) throw new Error("No peer IP available");
      return getGeolocation(peerIp);
    },
    enabled: !!peerIp && connectionState === "connected",
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });

  if (connectionState !== "connected") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        {connectionState === "connecting" ? "Connecting" : "Disconnected"}
      </span>
    );
  }

  if (!peerIp || isLoading) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Connected
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <span
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
          "bg-green-100 text-green-800",
        )}
      >
        Connected
      </span>

      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="font-mono">{geoData?.ip || peerIp}</span>
        </div>

        {geoData?.city && geoData?.country && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              {geoData.city}, {geoData.country}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
