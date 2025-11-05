import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
}

const ContactsModal: React.FC<ContactsModalProps> = ({ isOpen, onClose, onAddContact }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleAddNewContact = () => {
    if (name.trim() === '') {
      alert('El nombre es obligatorio.');
      return;
    }
    onAddContact({ name, email, phone, address });
    // Limpiar formulario
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <h2>Nuevo Contacto</h2>
        
        <div className="contact-form">
          <div className="modal-field">
            <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="modal-field">
            <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="modal-field">
            <input type="tel" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="modal-field">
            <input type="text" placeholder="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleAddNewContact} className="button-primary">Guardar Contacto</button>
          <button onClick={onClose} className="button-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ContactsModal;