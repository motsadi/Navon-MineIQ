export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type AlertStatus = "Open" | "Acknowledged" | "Closed";
export type Severity = "Low" | "Medium" | "High" | "Critical";

export interface Asset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  location: string;
  area?: string;
  criticality?: string;
  system_group?: string;
  primary_source?: string;
  phase1_population?: string;
  health_score: number;
  failure_risk: number;
  risk_level: RiskLevel;
  rul_days: number;
  status: string;
  open_alerts: number;
}

export interface Summary {
  total_assets: number;
  average_health_score: number;
  high_risk_assets: number;
  open_critical_alerts: number;
  open_alerts: number;
  predicted_downtime_risk_pct: number;
  energy_efficiency_pct: number;
  data_quality_score: number;
  avg_rul_days: number;
  risk_breakdown: Record<RiskLevel, number>;
  asset_risk_ranking: Array<Record<string, any>>;
  health_trend: Array<{ date: string; avg_health_score: number }>;
  top_alerts: Alert[];
}

export interface TelemetryPoint {
  timestamp: string;
  [key: string]: any;
}

export interface TelemetryResponse {
  asset_id: string;
  granularity: string;
  columns: string[];
  points: TelemetryPoint[];
}

export interface BaselineMetric {
  metric: string;
  unit: string;
  mean: number;
  std: number;
  lower_control_limit: number;
  upper_control_limit: number;
  warning_low: number;
  warning_high: number;
  critical_low: number;
  critical_high: number;
  latest_value?: number;
  in_envelope?: boolean;
  breaches: number;
}

export interface BaselineResponse {
  asset_id: string;
  training_window: string;
  metrics: BaselineMetric[];
}

export interface RulResponse {
  asset_id: string;
  asset_name: string;
  rul_days: number;
  rul_lower_days: number;
  rul_upper_days: number;
  confidence: number;
  method: string;
  estimated_failure_date: string;
  recommended_action: string;
  trend: Array<{ timestamp: string; rul_days: number; failure_risk: number; health_score: number }>;
}

export interface Alert {
  alert_id: string;
  asset_id: string;
  timestamp: string;
  severity: Severity;
  alert_type: string;
  reason_code: string;
  recommended_action: string;
  status: AlertStatus;
  owner_role?: string;
}

export interface AssetDetail {
  asset: Asset;
  latest_telemetry: Record<string, any>;
  rul: RulResponse;
  latest_prediction: Record<string, any>;
  open_alerts: number;
}

export interface MaintenanceEvent {
  work_order_id: string;
  asset_id: string;
  event_date: string;
  event_type: string;
  fault_category: string;
  action_taken: string;
  downtime_hours: number;
  cost_estimate: number;
  technician_notes: string;
  status: string;
}

export interface MaintenanceSummary {
  total_events: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  mttr_hours: number;
  mtbf_days: number;
  estimated_downtime_avoided_hours: number;
  total_cost_estimate: number;
  events: MaintenanceEvent[];
}

export interface PredictiveSummary {
  total_assets_scored: number;
  total_anomalies_detected: number;
  average_model_confidence: number;
  global_feature_importance: Record<string, number>;
  latest_predictions: Array<Record<string, any>>;
}

export interface EsgSummary {
  total_energy_kwh: number;
  total_avoidable_loss_kwh: number;
  avg_energy_intensity: number;
  ventilation_fan_efficiency_index: number | null;
  environmental_risk_score: number | null;
  ems_latest_indicators: Record<string, any>;
  energy_trend: Array<Record<string, any>>;
  ems_trend: Array<Record<string, any>>;
}

export interface DataQualitySource {
  source_system: string;
  source_type: string;
  interface: string;
  ingestion_status: string;
  freshness: string;
  completeness_pct: number;
  missing_value_rate_pct: number;
  quality_score: number;
  latest_timestamp: string;
  notes: string;
}

export interface ModelGovernanceRow {
  model_name: string;
  model_type: string;
  asset_class: string;
  version: string;
  training_period: string;
  validation_metric: string;
  last_trained: string;
  drift_status: string;
  approval_status: string;
  retraining_recommendation: string;
}

export interface TableResponse<T> {
  count: number;
  items: T[];
}

export interface DemoUser {
  username: string;
  display_name: string;
  role: string;
  access_level: string;
}

export type Role =
  | "Executive"
  | "Reliability Engineer"
  | "Maintenance Planner"
  | "Operations User"
  | "IT/OT Admin"
  | "SHE/ESG User";
