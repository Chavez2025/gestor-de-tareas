import { create } from 'zustand';
import { Contact } from './ContactsModal';

// --- Interfaces ---
interface Task {
  id: number;
  name: string;
  date: Date | null;
  description: string;
  isImportant: boolean;
  isCompleted: boolean;
  tags?: string[];
  reminderType?: 'email' | 'alarm' | 'whatsapp' | null;
  reminderRecipient?: string | null;
}

interface User {
  password: string;
  email: string;
}

// --- Funciones de LocalStorage (las movemos aquí para centralizar) ---
const getUsers = (): { [key: string]: User } => {
  const storedUsers = localStorage.getItem('task-manager-users');
  return storedUsers ? JSON.parse(storedUsers) : {};
};

const saveUsers = (users: { [key: string]: User }) => {
  localStorage.setItem('task-manager-users', JSON.stringify(users));
};

const getTasksForUser = (username: string): Task[] => {
  if (!username) return [];
  const storedTasks = localStorage.getItem(`tasks-for-user-${username}`);
  if (storedTasks) {
    const parsedTasks = JSON.parse(storedTasks);
    return parsedTasks.map((task: any) => ({
      ...task,
      date: task.date ? new Date(task.date) : null,
    }));
  }
  return [];
};

const saveTasksForUser = (username: string, tasks: Task[]) => {
  if (!username) return;
  localStorage.setItem(`tasks-for-user-${username}`, JSON.stringify(tasks));
};

const getContactsForUser = (username: string): Contact[] => {
  if (!username) return [];
  const storedContacts = localStorage.getItem(`contacts-for-user-${username}`);
  return storedContacts ? JSON.parse(storedContacts) : [];
};

const saveContactsForUser = (username: string, contacts: Contact[]) => {
  if (!username) return;
  localStorage.setItem(`contacts-for-user-${username}`, JSON.stringify(contacts));
};

// --- Definición del Store ---
interface AppState {
  currentUser: string | null;
  tasks: Task[];
  contacts: Contact[];
  login: (username: string) => void;
  logout: () => void;
  addTask: (taskDetails: Omit<Task, 'id' | 'isCompleted'>) => void;
  updateTask: (updatedTask: Task) => void;
  addContact: (contactDetails: Omit<Contact, 'id'>) => void;
  deleteContact: (contactId: number) => void;
  fetchInitialData: () => void;
  getUsers: () => { [key: string]: User }; // Añadimos la función al estado
}

export const useAppStore = create<AppState>((set, get) => ({
  // --- Estado Inicial ---
  currentUser: null,
  tasks: [],
  contacts: [],

  // --- Funciones expuestas ---
  getUsers: getUsers, // Exponemos la función a través del store

  // --- Acciones ---
  fetchInitialData: () => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      set({
        currentUser: user,
        tasks: getTasksForUser(user),
        contacts: getContactsForUser(user),
      });
    }
  },

  login: (username: string) => {
    localStorage.setItem('currentUser', username);
    set({
      currentUser: username,
      tasks: getTasksForUser(username),
      contacts: getContactsForUser(username),
    });
  },

  logout: () => {
    localStorage.removeItem('currentUser');
    set({ currentUser: null, tasks: [], contacts: [] });
  },

  addTask: (taskDetails) => {
    const { currentUser, tasks } = get();
    const newTask: Task = { id: Date.now(), ...taskDetails, isCompleted: false };
    const updatedTasks = [...tasks, newTask];
    set({ tasks: updatedTasks });
    if (currentUser) saveTasksForUser(currentUser, updatedTasks);
  },

  updateTask: (updatedTask) => {
    const { currentUser, tasks } = get();
    const updatedTasks = tasks.map(task => task.id === updatedTask.id ? updatedTask : task);
    set({ tasks: updatedTasks });
    if (currentUser) saveTasksForUser(currentUser, updatedTasks);
  },

  addContact: (contactDetails) => {
    const { currentUser, contacts } = get();
    const newContact: Contact = { id: Date.now(), ...contactDetails };
    const updatedContacts = [...contacts, newContact];
    set({ contacts: updatedContacts });
    if (currentUser) saveContactsForUser(currentUser, updatedContacts);
  },

  deleteContact: (contactId) => {
    const { currentUser, contacts } = get();
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    set({ contacts: updatedContacts });
    if (currentUser) saveContactsForUser(currentUser, updatedContacts);
  },
}));

// Exportamos las funciones de usuarios para usarlas en LoginPage
export { getUsers, saveUsers };