"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getGeolocation } from "@/lib/geolocation";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface IPGeolocationProps {
  ip: string;
}

export function IPGeolocation({ ip }: IPGeolocationProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Load preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("geolocation-preference");
    if (saved === "enabled") {
      setGeolocationEnabled(true);
      setDontAskAgain(true);
    } else if (saved === "disabled") {
      setDontAskAgain(true);
    }
  }, []);

  const handleSearchClick = () => {
    if (dontAskAgain && !geolocationEnabled) {
      // User previously said no and don't ask again
      return;
    }
    if (dontAskAgain && geolocationEnabled) {
      // Already enabled, no need to show dialog
      return;
    }
    setShowDialog(true);
  };

  const handleConfirm = (permanent: boolean) => {
    setGeolocationEnabled(true);
    setShowDialog(false);
    if (permanent) {
      setDontAskAgain(true);
      localStorage.setItem("geolocation-preference", "enabled");
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const { data: geoData, isLoading } = useQuery({
    queryKey: ["geolocation", ip],
    queryFn: () => {
      if (!ip) throw new Error("No IP address available");
      return getGeolocation(ip);
    },
    enabled: !!ip && geolocationEnabled,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono">{ip}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleSearchClick}
            disabled={dontAskAgain && geolocationEnabled}
            aria-label="Lookup location"
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>

        {geolocationEnabled && isLoading && (
          <div className="text-xs text-muted-foreground">
            Loading location...
          </div>
        )}

        {geolocationEnabled && geoData?.city && geoData?.country && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              {geoData.city}, {geoData.country}
            </span>
          </div>
        )}
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lookup IP Location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will use a third-party service (ipapi.co) to determine the
              approximate geographic location of this IP address. The IP address
              will be sent to their servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirm(false)}>
              Yes, just this once
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleConfirm(true)}>
              Yes, always
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
