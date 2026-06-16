"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/components/providers/PrivyClientProvider";
import { trackEvent } from "@/lib/google-analytics";

const API_KEY_STORAGE = "darkbloom_api_key";
const OLD_API_KEY_STORAGE = "eigeninference_api_key";
const COORD_URL_STORAGE = "darkbloom_coordinator_url";

export function useAuth() {
  const { ready, authenticated, user, login, logout: privyLogout, getAccessToken } = useAuthContext();
  // Dev mode: bypass Privy auth when dev key is present
  const isDevMode = typeof window !== "undefined" && localStorage.getItem("darkbloom_api_key")?.startsWith("dev-key-local-");
  const effectiveAuthenticated = authenticated || isDevMode;
  const [apiKeyReady, setApiKeyReady] = useState(isDevMode);

  // Derive useful fields from the Privy user
  const email = (user as { email?: { address?: string } } | null)?.email?.address || null;

  const displayName = email || null;

  // Migrate old API key and auto-provision on auth
  useEffect(() => {
    if (!effectiveAuthenticated || typeof window === "undefined") return;

    const oldKey = localStorage.getItem(OLD_API_KEY_STORAGE);
    if (oldKey && !localStorage.getItem(API_KEY_STORAGE)) {
      localStorage.setItem(API_KEY_STORAGE, oldKey);
      localStorage.removeItem(OLD_API_KEY_STORAGE);
    }

    if (localStorage.getItem(API_KEY_STORAGE)) {
      setApiKeyReady(true);
      return;
    }

    getAccessToken().then((token) => {
      if (!token) return;
      fetch("/api/auth/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.api_key) {
            localStorage.setItem(API_KEY_STORAGE, data.api_key);
            setApiKeyReady(true);
          } else {
            console.warn("[useAuth] Key provisioning returned no api_key:", data);
            setApiKeyReady(false);
          }
        })
        .catch((err) => {
          console.warn("[useAuth] Key provisioning failed:", err);
          setApiKeyReady(false);
        });
    });
  }, [effectiveAuthenticated, getAccessToken]);

  // Re-provision API key when it expires (401 from streamChat)
  useEffect(() => {
    if (!effectiveAuthenticated) return;
    const handleExpired = () => {
      setApiKeyReady(false);
      getAccessToken().then((token) => {
        if (!token) return;
        fetch("/api/auth/keys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.api_key) {
              localStorage.setItem(API_KEY_STORAGE, data.api_key);
              setApiKeyReady(true);
            } else {
              setApiKeyReady(false);
            }
          })
          .catch(() => setApiKeyReady(false));
      });
    };
    window.addEventListener("darkbloom-key-expired", handleExpired);
    return () => window.removeEventListener("darkbloom-key-expired", handleExpired);
  }, [effectiveAuthenticated, getAccessToken]);

  // Reset when logged out
  useEffect(() => {
    if (!effectiveAuthenticated) setApiKeyReady(false);
  }, [effectiveAuthenticated]);

  // Track login_success event once when the user authenticates
  const hasTrackedLogin = useRef(false);
  useEffect(() => {
    if (effectiveAuthenticated && !hasTrackedLogin.current) {
      hasTrackedLogin.current = true;
      trackEvent("login_success", { method: email ? "email" : "unknown" });
    }
    if (!effectiveAuthenticated) {
      hasTrackedLogin.current = false;
    }
  }, [effectiveAuthenticated, email]);

  // Clear all app-specific localStorage on login to prevent session poisoning
  // (e.g. attacker pre-sets coordinator URL before victim logs in).
  useEffect(() => {
    if (!effectiveAuthenticated || typeof window === "undefined") return;
    localStorage.removeItem(COORD_URL_STORAGE);
  }, [effectiveAuthenticated]);

  const logout = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(API_KEY_STORAGE);
      localStorage.removeItem(OLD_API_KEY_STORAGE);
      localStorage.removeItem(COORD_URL_STORAGE);
    }
    await privyLogout();
  }, [privyLogout]);

  return {
    ready,
    authenticated: effectiveAuthenticated,
    apiKeyReady,
    user,
    login,
    logout,
    getAccessToken,
    email,
    displayName,
  };
}
