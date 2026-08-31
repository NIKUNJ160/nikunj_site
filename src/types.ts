// TypeScript type definitions for nikunj-site

export interface PageViewRecord {
  id?: number | string;
  session_id: string;
  url_path: string;
  referrer?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  device_type?: string | null;
  country?: string | null;
  created_at?: string;
}

export interface EventLogRecord {
  id?: number | string;
  session_id: string;
  event_name: string;
  event_category?: string;
  url_path: string;
  event_data?: Record<string, any> | null;
  created_at?: string;
}

export interface AnalyticsTrackPayload {
  type: 'pageview' | 'event';
  session_id?: string;
  sessionId?: string;
  url_path?: string;
  path?: string;
  referrer?: string | null;
  user_agent?: string | null;
  userAgent?: string | null;
  event_name?: string | null;
  eventName?: string | null;
  event_category?: string | null;
  eventCategory?: string | null;
  event_data?: Record<string, any> | null;
  eventData?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  device_type?: string | null;
  deviceType?: string | null;
  country?: string | null;
}

export interface AnalyticsTopPage {
  url_path: string;
  path?: string;
  count: number;
}

export interface AnalyticsTopReferrer {
  referrer: string;
  count: number;
}

export interface AnalyticsTopEvent {
  event_name: string;
  event_category?: string;
  category?: string;
  count: number;
}

export interface AnalyticsStats {
  totalViews: number;
  uniqueSessions: number;
  totalEvents: number;
  conversionCount: number;
  topPages: AnalyticsTopPage[];
  topReferrers: AnalyticsTopReferrer[];
  topEvents: AnalyticsTopEvent[];
  recentPageViews: PageViewRecord[];
  recentEvents: EventLogRecord[];
}

export interface AnalyticsTrackResponse {
  success: boolean;
  message?: string;
  warning?: string;
  error?: string;
}
