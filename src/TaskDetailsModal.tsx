import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface TaskDetailsModalProps {
  taskName: string;
  onClose: () => void;
  onSave: (details: { name: string; date: Date | null; description: string; isImportant: boolean; tags: string[] }) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ taskName, onClose, onSave }) => {
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [tags, setTags] = useState('');


  const handleSave = () => {
    onSave({
      name: taskName,
      date,
      description,
      isImportant,
      tags: tags.split(',').map(tag => tag.trim()),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Detalles de la Tarea</h2>
        
        <div className="modal-field">
          <label>Nombre de la Tarea</label>
          <input type="text" value={taskName} readOnly disabled />
        </div>

        <div className="modal-field">
          <label>Fecha de Vencimiento</label>
          <DatePicker 
            selected={date} 
            onChange={(d: Date | null) => setDate(d)}
            showTimeSelect
            className="date-picker-input"
            placeholderText="Selecciona fecha y hora"
            dateFormat="dd/MM/yyyy h:mm aa"
            isClearable
          />
        </div>

        <div className="modal-field">
          <label>Etiquetas (separadas por coma)</label>
          <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Ej: laboral, estudios, personal"
          />
        </div>

        <div className="modal-field">
          <label>Descripción</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agrega más detalles..."
          />
        </div>

        <button onClick={() => setIsImportant(!isImportant)} className={`important-toggle-btn ${isImportant ? 'active' : ''}`}>
          {isImportant ? '★ Marcada como Importante' : '☆ Marcar como Importante'}
        </button>

        <div className="modal-actions">
          <button onClick={handleSave} className="button-primary">Guardar Tarea</button>
          <button onClick={onClose} className="button-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;