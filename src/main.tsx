import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TaskDetailsModal from './TaskDetailsModal';
import LoginPage from './LoginPage';
import ScreenRecorderPage from './ScreenRecorderPage';
import './styles.css';

interface Task {
  id: number;
  name: string;
  date: Date | null;
  description: string;
  isImportant: boolean;
}

// Componente de marcador de posición para el contenido principal
const PlaceholderContent: React.FC<{ title: string; allTasks: Task[]; onSaveTask: (details: any) => void }> = ({ title, allTasks, onSaveTask }) => {
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskNameToSave, setTaskNameToSave] = useState('');

  const now = new Date();
  // Filtra las tareas según la vista actual
  const displayedTasks = title === "Importante"
    ? allTasks.filter(task => task.isImportant)
    : title === "Tareas por vencer"
    ? allTasks.filter(task => 
        task.date && task.date > now && (task.date.getTime() - now.getTime()) < 24 * 60 * 60 * 1000
      )
    : allTasks;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      setTaskNameToSave(inputValue);
      setIsModalOpen(true);
    }
  };

  const handleSaveAndClose = (taskDetails: any) => {
    onSaveTask(taskDetails);
    setInputValue('');
    setIsModalOpen(false);
  };

  return (
    <main className="main-content">
      <header className="main-header">
        <h1>{title}</h1>
      </header>
      {/* Solo mostramos el campo de agregar tarea en la página "Mi día" */}
      {title === "Programa tu dia, programa tu vida." && (
        <div className="task-input-section">
          <input 
            type="text" 
            className="task-input" 
            placeholder="Agregar una tarea y presiona Enter"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}
      <ul className="task-list">
        {displayedTasks.map(task => {
          const isOverdue = task.date && task.date < new Date();
          return (
            <li key={task.id} className={isOverdue ? 'task-overdue' : ''}>
              <div className="task-name">
                {task.name}
                {task.isImportant && <span className="important-star"> &#9733;</span>}
              </div>
              {isOverdue && <div className="task-status-label overdue-label">Vencida</div>}
              {task.date && <div className="task-details">Vence: {task.date.toLocaleString()}</div>}
              {task.description && <div className="task-details">{task.description}</div>}
            </li>
          );
        })}
      </ul>

      {isModalOpen && (
        <TaskDetailsModal 
          taskName={taskNameToSave}
          onClose={() => {
            setIsModalOpen(false);
            setInputValue(''); // Limpiar input si se cancela
          }}
          onSave={handleSaveAndClose}
        />
      )}
    </main>
  );
};

// --- Funciones para manejar el almacenamiento de tareas por usuario ---
const getTasksForUser = (username: string): Task[] => {
  if (!username) return [];
  const storedTasks = localStorage.getItem(`tasks-for-user-${username}`);
  if (storedTasks) {
    // Es importante convertir las fechas de string a objeto Date
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

const App = () => {
  // Lee del localStorage para ver si ya hay una sesión activa
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('currentUser'));
  const [tasks, setTasks] = useState<Task[]>(() => currentUser ? getTasksForUser(currentUser) : []);

  const isAuthenticated = !!currentUser;

  // Cargar y guardar tareas cuando el usuario o las tareas cambien
  useEffect(() => {
    if (currentUser) {
      setTasks(getTasksForUser(currentUser));
    } else {
      setTasks([]); // Limpiar tareas si no hay usuario
    }
  }, [currentUser]);

  const handleSaveTask = (taskDetails: { name: string; date: Date | null; description: string; isImportant: boolean }) => {
    const newTask: Task = {
      id: Date.now(),
      ...taskDetails,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    if (currentUser) {
      saveTasksForUser(currentUser, updatedTasks);
    }
  };

  const handleLogin = (username: string) => {
    localStorage.setItem('currentUser', username);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar isAuthenticated={isAuthenticated} username={currentUser} onLogout={handleLogout} />
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/GestionarMiDia" element={<PlaceholderContent title="Programa tu dia, programa tu vida." allTasks={tasks} onSaveTask={handleSaveTask} />} />
              <Route path="/important" element={<PlaceholderContent title="Importante" allTasks={tasks} onSaveTask={handleSaveTask} />} />
              <Route path="/assigned" element={<PlaceholderContent title="Asignadas a mí" allTasks={tasks} onSaveTask={handleSaveTask} />} />
              <Route path="/tasks" element={<PlaceholderContent title="Tareas por vencer" allTasks={tasks} onSaveTask={handleSaveTask} />} />
              <Route path="/screen-recorder" element={<ScreenRecorderPage />} />
              {/* Si un usuario autenticado va a /login, lo redirigimos */}
              <Route path="/login" element={<Navigate to="/GestionarMiDia" replace />} />
              <Route path="/" element={<Navigate to="/GestionarMiDia" replace />} />
              <Route path="*" element={<Navigate to="/GestionarMiDia" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
