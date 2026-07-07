import { useEffect, useState } from "react";
import { isOnline, onNetworkChange } from "@/features/sync/services/network.service";

/** Reactive online/offline status backed by the network service. */
export function useNetwork(): boolean {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    setOnline(isOnline());
    return onNetworkChange(setOnline);
  }, []);

  return online;
}
