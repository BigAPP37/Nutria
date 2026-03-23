// src/types/tdee.ts
export interface CalorieGoal { tdee_kcal:number; goal_kcal:number; deficit_or_surplus:number; protein_g:number; carbs_g:number; fat_g:number; confidence_level:number; confidence_label:string; }
export interface TdeeDisplayState { goal_kcal:number; confidence_level:number; confidence_label:string; weeks_of_data:number; last_adjusted:string; macro_targets:{protein_g:number;carbs_g:number;fat_g:number}; }
export interface WeeklySnapshotDisplay { week_label:string; avg_weight_kg:number|null; weight_delta_kg:number|null; avg_calories_day:number|null; complete_days:number; was_adjusted:boolean; adjustment_kcal:number; tdee_after:number; }
export interface ProgressSummary { current_weight_kg:number; start_weight_kg:number; weight_change_kg:number; weeks_tracked:number; avg_adherence_pct:number; tdee_trend:"stable"|"increasing"|"decreasing"; weekly_snapshots:WeeklySnapshotDisplay[]; calorie_goal:CalorieGoal; }
export interface TdeeUpdateResponse { success:boolean; result?:{was_adjusted:boolean;reason:string;new_tdee?:number}; week?:string; processed?:number; adjusted?:number; skipped?:number; error?:string; }
