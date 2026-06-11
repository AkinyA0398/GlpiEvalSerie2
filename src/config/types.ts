export interface Task {
  id: string;
  title: string;
  description: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface KanbanData {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
}