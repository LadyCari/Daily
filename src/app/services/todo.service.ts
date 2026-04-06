import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Todo } from '../interfaces/todo.inerface';

@Injectable({
  providedIn: 'root'
})

export class TodoService {
  private readonly STORAGE_KEY = 'todos';
  private todos: Todo[] = [];

  constructor(private storage: StorageService) {
    this.loadTodos();
  }

  async loadTodos(): Promise<Todo[]> {
    const stored = await this.storage.get(this.STORAGE_KEY);
    this.todos = stored || [];

    let changed = false;
    this.todos = this.todos.map((t: Todo, index: number) => {
      if (t.colorSlot === 1 || t.colorSlot === 2 || t.colorSlot === 3 || t.colorSlot === 4) {
        return t;
      }
      changed = true;
      return { ...t, colorSlot: (((index % 4) + 1) as 1 | 2 | 3 | 4) };
    });

    if (changed) {
      await this.storage.set(this.STORAGE_KEY, this.todos);
    }
    return this.todos;
  }

  getTodos(): Todo[] {
    return this.todos;
  }

  async addTodo(title: string, isPrivate = false): Promise<void> {
    const nextSlot = ((((this.todos.length ?? 0) % 4) + 1) as 1 | 2 | 3 | 4);
    const newTodo: Todo = {
      id: Date.now().toString(),
      title: title,
      completed: false,
      createdAt: new Date(),
      colorSlot: nextSlot,
      private: isPrivate || undefined
    };

    this.todos.push(newTodo);
    await this.storage.set(this.STORAGE_KEY, this.todos);
  }

  async setTodos(todos: Todo[]): Promise<void> {
    this.todos = [...todos];
    await this.storage.set(this.STORAGE_KEY, this.todos);
  }

  async toggleTodo(id: string): Promise<void> {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      await this.storage.set(this.STORAGE_KEY, this.todos);
    }
  }

  async deleteTodo(id: string): Promise<void> {
    this.todos = this.todos.filter(t => t.id !== id);
    await this.storage.set(this.STORAGE_KEY, this.todos);
  }

  async updateTodo(id: string, title: string): Promise<void> {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.title = title;
      await this.storage.set(this.STORAGE_KEY, this.todos);
    }
  }
}