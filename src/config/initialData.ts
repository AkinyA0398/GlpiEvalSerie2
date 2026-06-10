import { KanbanData } from './types';

export const initialData: KanbanData = {
  tasks: {
    'task-1': { id: 'task-1', title: 'Rédiger les specs', description: 'Définir le besoin client' },
    'task-2': { id: 'task-2', title: 'Créer la maquette', description: 'Design Figma du tableau' },
    'task-3': { id: 'task-3', title: 'Setup le projet', description: 'Init React + Vite + TS' },
  },
  columns: {
    'col-todo': { id: 'col-todo', title: 'À faire', taskIds: ['task-1', 'task-2'] },
    'col-inprogress': { id: 'col-inprogress', title: 'En cours', taskIds: ['task-3'] },
    'col-done': { id: 'col-done', title: 'Terminé', taskIds: [] },
  },
  columnOrder: ['col-todo', 'col-inprogress', 'col-done'],
};