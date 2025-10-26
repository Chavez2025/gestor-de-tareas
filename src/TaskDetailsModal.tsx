import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface TaskDetailsModalProps {
  taskName: string;
  onClose: () => void;
  onSave: (task: { name: string; date: Date | null; description: string; isImportant: boolean }) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ taskName, onClose, onSave }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  const handleSave = () => {
    onSave({
      name: taskName,
      date: selectedDate,
      description: description,
      isImportant: isImportant,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{taskName}</h2>
        
        <button 
          className={`important-toggle-btn ${isImportant ? 'active' : ''}`} 
          onClick={() => setIsImportant(!isImportant)}>
          &#9733; Marcar como importante
        </button>
        
        <div className="modal-field">
          <label htmlFor="date-picker">Vencimiento:</label>
          <DatePicker 
            selected={selectedDate} 
            onChange={(date: Date | null) => setSelectedDate(date)}
            dateFormat="dd/MM/yyyy h:mm aa"
            showTimeSelect
            className="date-picker-input"
          />
        </div>

        <div className="modal-field">
          <label htmlFor="description-input">Descripción:</label>
          <textarea 
            id="description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Añadir una descripción..."
          />
        </div>

        <div className="modal-actions">
          <button onClick={handleSave} className="button-primary">Guardar Tarea</button>
          <button onClick={onClose} className="button-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;