import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Network from 'expo-network';

type ConnectivityContextValue = {
  /** Whether the device currently appears to have internet access. */
  isOnline: boolean;
  /** Force a re-check of the network state. */
  refresh: () => Promise<void>;
};

const ConnectivityContext = createContext<ConnectivityContextValue>({
  isOnline: true,
  refresh: async () => {},
});

function stateIsOnline(state: Network.NetworkState): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) setIsOnline(stateIsOnline(state));
      } catch {
        // If detection fails, assume online; API failures fall back to cache.
        if (mounted) setIsOnline(true);
      }
    };

    void refresh();

    let subscription: { remove: () => void } | undefined;
    try {
      subscription = Network.addNetworkStateListener((state) => {
        if (mounted) setIsOnline(stateIsOnline(state));
      });
    } catch {
      subscription = undefined;
    }

    const appStateSub = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') void refresh();
    });

    return () => {
      mounted = false;
      subscription?.remove();
      appStateSub.remove();
    };
  }, []);

  const value = useMemo<ConnectivityContextValue>(
    () => ({
      isOnline,
      refresh: async () => {
        try {
          const state = await Network.getNetworkStateAsync();
          setIsOnline(stateIsOnline(state));
        } catch {
          setIsOnline(true);
        }
      },
    }),
    [isOnline],
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity(): ConnectivityContextValue {
  return useContext(ConnectivityContext);
}
