export interface DeviceAnalyticsSummary {
  cardiox: {
    devices_registered: number;
    devices_active: number;
  };
  rhythm: {
    devices_registered: number;
    devices_active: number;
    users_registered: number;
    users_active: number;
  };
  active_window_days: number;
  generated_at: string;
}

export interface DeviceMatch {
  id: number;
  full_name: string;
  doctor_name: string;
  phone: string;
  pc_name: string;
  rhythmulta_serial: string;
  license_status: "active" | "revoked";
  last_heartbeat: string | null;
  online_now: boolean;
}

export interface RhythmUltraDeviceMatch {
  machine_serial: string;
  last_seen: string;
  active: boolean;
  mobile_numbers: string[];
}

export interface CardioXDeviceWithUsers {
  rhythmulta_serial: string;
  last_heartbeat: string | null;
  active_30d: boolean;
  online_now: boolean;
  users: DeviceMatch[];
}

export interface RhythmUser {
  mobile_number: string;
  name: string | null;
  last_login: string | null;
  active_30d: boolean;
}

export interface DeviceLookupResponse {
  device_id_query: string;
  matches: DeviceMatch[];
  match_count: number;
}

export interface RhythmUltraDeviceLookupResponse {
  device_id_query: string;
  matches: RhythmUltraDeviceMatch[];
  match_count: number;
}

export interface CardioXDeviceLookupResponse {
  device_id_query: string;
  matches: CardioXDeviceWithUsers[];
  match_count: number;
}

export interface RhythmUsersLookupResponse {
  users: RhythmUser[];
  user_count: number;
}

export interface AnalyticsSummaryResponse {
  success: boolean;
  data: DeviceAnalyticsSummary;
}

export interface DeviceLookupAPIResponse {
  success: boolean;
  data: DeviceLookupResponse;
}

export interface RhythmUltraDeviceLookupAPIResponse {
  success: boolean;
  data: RhythmUltraDeviceLookupResponse;
}

export interface CardioXDeviceLookupAPIResponse {
  success: boolean;
  data: CardioXDeviceLookupResponse;
}

export interface RhythmUsersLookupAPIResponse {
  success: boolean;
  data: RhythmUsersLookupResponse;
}

export interface AnalyticsErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}
