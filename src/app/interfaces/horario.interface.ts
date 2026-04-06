export interface HorarioModel {
  id: string;
  title: string;
  startHour: string;
  endHour?: string;
  weekdays: number[];
  private?: boolean;
}