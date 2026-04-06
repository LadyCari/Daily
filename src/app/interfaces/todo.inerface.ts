export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  colorSlot?: 1 | 2 | 3 | 4;
  private?: boolean;
}