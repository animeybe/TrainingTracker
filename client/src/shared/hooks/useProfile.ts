import { useState, useEffect } from "react";
import { profileApi } from "@/shared/api/profileApi";
import type { ProfileData } from "@/shared/api/types";

export const useProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return { profile, loadingProfile, reloadProfile: loadProfile };
};
