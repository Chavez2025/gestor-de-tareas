import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { FontAwesomeIcon, } from '@fortawesome/react-fontawesome';
import { faBell, faEnvelope, faMobileAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TaskDetailsModal from './TaskDetailsModal';
import LoginPage from './LoginPage';
import { Contact } from './ContactsModal';
import ContactsPage from './ContactsPage';
import ScreenRecorderPage from './ScreenRecorderPage';
import './styles.css';

interface Task {
  id: number;
  name: string;
  date: Date | null;
  description: string;
  isImportant: boolean;
  isCompleted: boolean;
  reminderType?: 'email' | 'alarm' | 'whatsapp' | null;
  reminderRecipient?: string | null;
}

interface User {
  password: string;
  email: string;
}

// --- Funciones para manejar el almacenamiento de usuarios por usuario ---
const getUsers = (): { [key: string]: User } => {
  const storedUsers = localStorage.getItem('task-manager-users');
  return storedUsers ? JSON.parse(storedUsers) : {};
};

const saveUsers = (users: { [key: string]: User }) => {
  localStorage.setItem('task-manager-users', JSON.stringify(users));
};

// Componente de marcador de posición para el contenido principal
const PlaceholderContent: React.FC<{ 
  title: string; 
  allTasks: Task[]; 
  onSaveTask: (details: any) => void;
  onUpdateTask: (updatedTask: Task) => void;
}> = ({ title, allTasks, onSaveTask, onUpdateTask }) => {
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskNameToSave, setTaskNameToSave] = useState('');
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [selectedTaskForReminder, setSelectedTaskForReminder] = useState<Task | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [openReminderMenuId, setOpenReminderMenuId] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Primero, filtramos entre activas y archivadas
  const filteredByCompletion = allTasks.filter(task => showArchived ? task.isCompleted : !task.isCompleted);

  // Filtra las tareas según la vista actual (esta lógica se moverá o adaptará)
  const displayedTasks = filteredByCompletion;

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

  const handleSetReminder = (taskId: number, type: 'email' | 'alarm' | 'whatsapp') => {
    const taskToUpdate = allTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    let recipient: string | null = null;
    if (type === 'email') {
      const currentUser = localStorage.getItem('currentUser');
      const users = getUsers();
      if (currentUser && users[currentUser]) {
        recipient = users[currentUser].email;
      }
    }

    const updatedTask = { ...taskToUpdate, reminderType: type, reminderRecipient: recipient };
    onUpdateTask(updatedTask);
    setOpenReminderMenuId(null); // Cierra el menú
    // Opcional: mostrar una alerta o notificación
    alert(`Recordatorio por ${type} configurado. ${recipient ? `Se enviará a: ${recipient}` : ''}`);
  };

  const handleOpenWhatsappModal = (task: Task) => {
    setSelectedTaskForReminder(task);
    setWhatsappNumber(task.reminderRecipient || ''); // Pre-rellenar si ya existe un número
    setIsWhatsappModalOpen(true);
    setOpenReminderMenuId(null); // Cerrar el menú de recordatorios
  };

  const handleSaveWhatsappReminder = () => {
    if (selectedTaskForReminder && whatsappNumber) {
      const updatedTask = { ...selectedTaskForReminder, reminderType: 'whatsapp' as const, reminderRecipient: whatsappNumber };
      onUpdateTask(updatedTask);
      setIsWhatsappModalOpen(false);
    }
  };

  const handleTaskClick = (taskId: number) => {
    setExpandedTaskId(prevId => (prevId === taskId ? null : taskId));
  };

  const handleToggleComplete = (taskId: number) => {
    const taskToUpdate = allTasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      const updatedTask = { ...taskToUpdate, isCompleted: !taskToUpdate.isCompleted };
      onUpdateTask(updatedTask);
    }
  };

  return (
    <main className="main-content">
      <header className="main-header">
        <h1>{title}</h1>
      </header>
      {/* Solo mostramos el campo de agregar tarea en la página "Mi día" */}
      {title === "Comienza a organizarte..." && (
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
      <div className="task-list-header">
        <h2 className="task-list-title">
          {showArchived ? 'Tareas Archivadas' : 'Lista de tareas'}
        </h2>
        <button onClick={() => setShowArchived(!showArchived)} className="button-as-title">
          {showArchived ? 'Atras' : 'Ver Archivadas'}
        </button>
      </div>
      <ul className="task-list">
        {displayedTasks.map(task => {
          const isOverdue = task.date && task.date < new Date();
          return (
            <li 
              key={task.id} 
              className={`${isOverdue ? 'task-overdue' : ''} ${expandedTaskId === task.id ? 'expanded' : ''} ${task.isCompleted ? 'completed' : ''}`}
              onClick={() => handleTaskClick(task.id)}
            >
              <div className="reminder-container">
                <button 
                  className="reminder-icon-btn" 
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que el clic se propague al <li> y expanda la tarea
                    setOpenReminderMenuId(openReminderMenuId === task.id ? null : task.id);
                  }}
                  title="Selecciona modo de recordatorio">
                  <FontAwesomeIcon icon={faBell} />
                </button>
                {task.reminderType === 'email' && <FontAwesomeIcon icon={faEnvelope} className="reminder-type-icon" title={`Email a: ${task.reminderRecipient}`} />}
                {task.reminderType === 'alarm' && <FontAwesomeIcon icon={faClock} className="reminder-type-icon" title="Recordatorio por alarma" />}
                {task.reminderType === 'whatsapp' && <FontAwesomeIcon icon={faMobileAlt} className="reminder-type-icon" title="Recordatorio por WhatsApp" />}

                {openReminderMenuId === task.id && (
                  <div className="reminder-menu">
                    <div className="reminder-menu-header">Tipo de recordatorio</div>
                    <ul>
                      <li onClick={() => {
                        handleSetReminder(task.id, 'email');
                      }}>
                        <FontAwesomeIcon icon={faEnvelope} /> Correo electrónico
                      </li>
                      <li onClick={() => {
                        handleSetReminder(task.id, 'alarm');
                      }}>
                        <FontAwesomeIcon icon={faClock} /> Alarma
                      </li>
                      <li onClick={() => handleOpenWhatsappModal(task)}>
                        <FontAwesomeIcon icon={faMobileAlt} /> WhatsApp
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="task-content">
                <div className="task-name">{task.name}</div>
                {isOverdue && <div className="task-status-label overdue-label">Vencida</div>}
                {task.date && <div className="task-details">Vence: {task.date.toLocaleString()}</div>}
                {expandedTaskId === task.id && task.description && (
                  <div className="task-details task-description">{task.description}</div>
                )}
              </div>
              <div className="task-actions">
                {task.isImportant && <span className="important-star"> &#9733;</span>}
                <div className="task-completion-action" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    id={`task-check-${task.id}`}
                    className="task-checkbox"
                    checked={task.isCompleted}
                    onChange={() => handleToggleComplete(task.id)}
                  />
                  <label htmlFor={`task-check-${task.id}`}>Hecha</label>
                </div>
              </div>
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

      {isWhatsappModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Recordatorio por WhatsApp</h2>
            <div className="modal-field">
              <label htmlFor="whatsapp-input">Número de Teléfono:</label>
              <input
                type="tel"
                id="whatsapp-input"
                className="whatsapp-input"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Ej: +14155552671"
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveWhatsappReminder} className="button-primary">Registrar Número</button>
              <button onClick={() => setIsWhatsappModalOpen(false)} className="button-secondary">Cancelar</button>
            </div>
          </div>
        </div>
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

// --- Funciones para manejar el almacenamiento de contactos por usuario ---
const getContactsForUser = (username: string): Contact[] => {
  if (!username) return [];
  const storedContacts = localStorage.getItem(`contacts-for-user-${username}`);
  return storedContacts ? JSON.parse(storedContacts) : [];
};

const saveContactsForUser = (username: string, contacts: Contact[]) => {
  if (!username) return;
  localStorage.setItem(`contacts-for-user-${username}`, JSON.stringify(contacts));
};

const App = () => {
  // Lee del localStorage para ver si ya hay una sesión activa
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(() => currentUser ? getTasksForUser(currentUser) : []);
  const [contacts, setContacts] = useState<Contact[]>(() => currentUser ? getContactsForUser(currentUser) : []);

  const isAuthenticated = !!currentUser;

  // Cargar y guardar tareas cuando el usuario o las tareas cambien
  useEffect(() => {
    setContacts(currentUser ? getContactsForUser(currentUser) : []);
  }, [currentUser]);

  const handleAddContact = (contactDetails: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      id: Date.now(),
      ...contactDetails,
    };
    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    if (currentUser) {
      saveContactsForUser(currentUser, updatedContacts);
    }
  };

  const handleDeleteContact = (contactId: number) => {
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    setContacts(updatedContacts);
    if (currentUser) {
      saveContactsForUser(currentUser, updatedContacts);
    }
  };

  const handleSaveTask = (taskDetails: { name: string; date: Date | null; description: string; isImportant: boolean; tags: string[] }) => {
    const newTask: Task = {
      id: Date.now(),
      ...taskDetails,
      // Limpiar y filtrar tags vacíos
      tags: taskDetails.tags.map(t => t.trim()).filter(t => t),
      isCompleted: false, // Las nuevas tareas no están completadas por defecto
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    if (currentUser) {
      saveTasksForUser(currentUser, updatedTasks);
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? {
        ...updatedTask,
        tags: updatedTask.tags?.map(t => t.trim()).filter(t => t) || []
      } : task
    );
    setTasks(updatedTasks);
    if (currentUser) {
      saveTasksForUser(currentUser, updatedTasks);
    }
  };

  const handleLogin = (username: string) => {
    // Guardar el usuario actual en localStorage y en el estado
    localStorage.setItem('currentUser', username);
    setCurrentUser(username);
    // Cargar las tareas para el usuario que acaba de iniciar sesión
    setTasks(getTasksForUser(username));
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
              <Route path="/hoy" element={<PlaceholderContent title="Comienza a organizarte..." allTasks={tasks} onSaveTask={handleSaveTask} onUpdateTask={handleUpdateTask} />} />
              <Route path="/important" element={<PlaceholderContent title="Importante" allTasks={tasks} onSaveTask={handleSaveTask} onUpdateTask={handleUpdateTask} />} />
              <Route path="/contacts" element={<ContactsPage contacts={contacts} onAddContact={handleAddContact} onDeleteContact={handleDeleteContact} />} />
              <Route path="/tasks" element={<PlaceholderContent title="Tareas por vencer" allTasks={tasks} onSaveTask={handleSaveTask} onUpdateTask={handleUpdateTask} />} />
              <Route path="/screen-recorder" element={<ScreenRecorderPage />} />
              {/* Si un usuario autenticado va a /login, lo redirigimos */}
              <Route path="/login" element={<Navigate to="/hoy" replace />} />
              <Route path="/" element={<Navigate to="/hoy" replace />} />
              <Route path="*" element={<Navigate to="/hoy" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} getUsers={getUsers} saveUsers={saveUsers} />} />
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
