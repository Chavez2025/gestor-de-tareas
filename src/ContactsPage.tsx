import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Contact } from './ContactsModal';
import ContactsModal from './ContactsModal';

interface ContactsPageProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onDeleteContact: (contactId: number) => void;
}

const ContactsPage: React.FC<ContactsPageProps> = ({ contacts, onAddContact, onDeleteContact }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedContactId, setExpandedContactId] = useState<number | null>(null);

  const handleContactClick = (contactId: number) => {
    setExpandedContactId(prevId => (prevId === contactId ? null : contactId));
  };

  return (
    <main className="main-content">
      <header className="main-header">
        <h1>Libreta de Contactos</h1>
      </header>

      <div className="task-list-header">
        <h2 className="task-list-title">Mis Contactos</h2>
        <button onClick={() => setIsModalOpen(true)} className="button-primary">
          Nuevo Contacto
        </button>
      </div>

      <div className="contact-list-view" style={{ maxHeight: 'none' }}>
        <ul className="contact-list">
          {contacts.map(contact => (
            <li 
              key={contact.id} 
              className={`contact-item ${expandedContactId === contact.id ? 'expanded' : ''}`}
              onClick={() => handleContactClick(contact.id)}
              title="Clic para ver tarjeta"
            >
              <div className="contact-info">
                <strong>{contact.name}</strong>
                {expandedContactId === contact.id && (
                  <div className="contact-details-expanded">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                    {contact.address && <span>{contact.address}</span>}
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDeleteContact(contact.id); }} className="button-danger contact-delete-btn">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </li>
          ))}
          {contacts.length === 0 && <p>No tienes contactos guardados.</p>}
        </ul>
      </div>

      <ContactsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddContact={(contactDetails) => {
          onAddContact(contactDetails);
          setIsModalOpen(false); // Cierra el modal después de guardar
        }}
      />
    </main>
  );
};

export default ContactsPage;