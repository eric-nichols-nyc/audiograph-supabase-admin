import { ArtistMetric } from "@/types/artists";
import { ViberateResponse } from "@/services/viberate-service";

export type AnalyticsMappingValue = {
  platform: string;
  metric_type: ArtistMetric["metric_type"];
};

const viberateMetricsConfig: {
  [key in keyof ViberateResponse["artist_analytics"]]?: AnalyticsMappingValue;
} = {
  spotify_monthly_listeners: {
    platform: "spotify",
    metric_type: "monthly_listeners",
  },
  facebook_followers: {
    platform: "facebook",
    metric_type: "followers",
  },
  instagram_followers: {
    platform: "instagram",
    metric_type: "followers",
  },
  youtube_subscribers: {
    platform: "youtube",
    metric_type: "subscribers",
  },
  spotify_followers: {
    platform: "spotify",
    metric_type: "followers",
  },
  tiktok_followers: {
    platform: "tiktok",
    metric_type: "followers",
  },
  soundcloud_followers: {
    platform: "soundcloud",
    metric_type: "followers",
  },
};

export default viberateMetricsConfig; 