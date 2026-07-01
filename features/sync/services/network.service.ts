import NetInfo from "@react-native-community/netinfo";

/**
 * Network detection service
 * Monitors network connectivity status
 */

let networkListeners: Set<(isOnline: boolean) => void> = new Set();
let currentOnlineStatus: boolean = true;

/**
 * Initialize network monitoring
 */
export function initializeNetworkMonitoring() {
  NetInfo.fetch().then((state: any) => {
    currentOnlineStatus = state.isConnected ?? false;
  });

  const unsubscribe = NetInfo.addEventListener((state: any) => {
    const isOnline = state.isConnected ?? false;
    if (isOnline !== currentOnlineStatus) {
      currentOnlineStatus = isOnline;
      networkListeners.forEach((listener) => listener(isOnline));
    }
  });

  return unsubscribe;
}

/**
 * Get current network status
 */
export function isOnline(): boolean {
  return currentOnlineStatus;
}

/**
 * Subscribe to network changes
 */
export function onNetworkChange(callback: (isOnline: boolean) => void) {
  networkListeners.add(callback);
  return () => {
    networkListeners.delete(callback);
  };
}

/**
 * Check if network is available (async)
 */
export async function checkNetworkAvailability(): Promise<boolean> {
  const state = await NetInfo.fetch();
  currentOnlineStatus = state.isConnected ?? false;
  return currentOnlineStatus;
}
