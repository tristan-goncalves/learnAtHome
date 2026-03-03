import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private firestore = inject(Firestore);

  getUserTasks(userId: string): Observable<Task[]> {
    const q = query(
      collection(this.firestore, 'tasks'),
      where('userId', '==', userId)
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map((tasks: any[]) => tasks
        .map(t => ({
          ...t,
          dueDate: t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate),
          createdAt: t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
        }))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      )
    );
  }

  async addTask(task: Omit<Task, 'id'>): Promise<void> {
    await addDoc(collection(this.firestore, 'tasks'), {
      ...task,
      dueDate: Timestamp.fromDate(new Date(task.dueDate)),
      createdAt: Timestamp.fromDate(new Date())
    });
  }

  async updateTask(id: string, task: Partial<Task>): Promise<void> {
    const data: any = { ...task };
    if (task.dueDate) data.dueDate = Timestamp.fromDate(new Date(task.dueDate));
    await updateDoc(doc(this.firestore, 'tasks', id), data);
  }

  async deleteTask(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'tasks', id));
  }

  async toggleComplete(id: string, completed: boolean): Promise<void> {
    await updateDoc(doc(this.firestore, 'tasks', id), { completed });
  }
}
