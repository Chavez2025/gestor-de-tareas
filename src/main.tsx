import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { FontAwesomeIcon, } from '@fortawesome/react-fontawesome';
import { faBell, faEnvelope, faMobileAlt, faClock, faEdit } from '@fortawesome/free-solid-svg-icons';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TaskDetailsModal from './TaskDetailsModal';
import LoginPage from './LoginPage';
import ContactsPage from './ContactsPage';
import ScreenRecorderPage from './ScreenRecorderPage';
import './styles.css';
import DatePicker from 'react-datepicker'; // Importar DatePicker
import "react-datepicker/dist/react-datepicker.css"; // Importar estilos de DatePicker
import { useAppStore } from './store'; // Importar el store

interface Task {
  id: number;
  name: string;
  date: Date | null;
  description: string;
  tags?: string[];
  isImportant: boolean;
  isCompleted: boolean;
  reminderType?: 'email' | 'alarm' | 'whatsapp' | null;
  reminderRecipient?: string | null;
}

// Componente de marcador de posición para el contenido principal
const PlaceholderContent: React.FC<{ 
  title: string; 
}> = ({ title }) => {
  // Obtenemos el estado y las acciones directamente del store
  const allTasks = useAppStore((state) => state.tasks);
  const onSaveTask = useAppStore((state) => state.addTask);
  const onUpdateTask = useAppStore((state) => state.updateTask);
  const getUsers = useAppStore((state) => state.getUsers);

  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskNameToSave, setTaskNameToSave] = useState('');
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [selectedTaskForReminder, setSelectedTaskForReminder] = useState<Task | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [openReminderMenuId, setOpenReminderMenuId] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editingDateTaskId, setEditingDateTaskId] = useState<number | null>(null); // Nuevo estado para la edición de fecha

  // Primero, filtramos entre activas y archivadas
  const filteredByCompletion = allTasks.filter(task => showArchived ? task.isCompleted : !task.isCompleted);

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

  // Función para iniciar la edición de fecha/hora
  const handleEditDateClick = (taskId: number) => {
    setEditingDateTaskId(taskId);
  };

  // Función para manejar el cambio de fecha/hora
  const handleDateChange = (taskId: number, newDate: Date | null) => {
    const taskToUpdate = allTasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      const updatedTask = { ...taskToUpdate, date: newDate };
      onUpdateTask(updatedTask);
      setEditingDateTaskId(null); // Cerrar el DatePicker después de seleccionar
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
        {filteredByCompletion.map(task => {
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
                {task.date && (
              <div className="task-details date-display-container">
                {editingDateTaskId === task.id ? (
                  // Si estamos editando, mostrar el DatePicker
                  <div onClick={(e) => e.stopPropagation()}> {/* Evitar que el clic en el DatePicker cierre la edición */}
                <DatePicker
                  selected={task.date}
                  onChange={(d: Date | null) => handleDateChange(task.id, d)}
                  showTimeSelect
                  dateFormat="dd/MM/yyyy h:mm aa"
                  isClearable
                  className="task-date-editor-input"
                  onCalendarClose={() => setEditingDateTaskId(null)} // Cerrar edición al cerrar el calendario
                  onClickOutside={() => setEditingDateTaskId(null)} // Cerrar edición al hacer clic fuera
                />
              </div>
                ) : (
                  // Si no estamos editando, mostrar la fecha y el botón de edición
                  <>
                    Vence: {task.date.toLocaleString()}
                    <button
                      className="edit-date-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDateClick(task.id);
                      }}
                      title="Editar fecha y hora"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </>
                )}
              </div>
            )}
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

const App = () => {
  // Obtenemos el estado y la acción para cargar datos iniciales del store
  const currentUser = useAppStore((state) => state.currentUser);
  const fetchInitialData = useAppStore((state) => state.fetchInitialData);
  const isAuthenticated = !!currentUser;

  // Al cargar la app, intentamos recuperar la sesión del localStorage
  useEffect(() => {
    fetchInitialData();
  }, []); // El array vacío asegura que solo se ejecute una vez

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/hoy" element={<PlaceholderContent title="Comienza a organizarte..." />} />
              <Route path="/important" element={<PlaceholderContent title="Importante" />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/tasks" element={<PlaceholderContent title="Tareas por vencer" />} />
              <Route path="/screen-recorder" element={<ScreenRecorderPage />} />
              {/* Si un usuario autenticado va a /login, lo redirigimos */}
              <Route path="/login" element={<Navigate to="/hoy" replace />} />
              <Route path="/" element={<Navigate to="/hoy" replace />} />
              <Route path="*" element={<Navigate to="/hoy" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginPage />} />
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
