import React, { useState, useRef, useEffect } from 'react';
import { addRecording, getAllRecordingsForUser, updateRecordingName, deleteRecording } from './db';

interface Recording {
  id: number;
  name: string;
  blob: Blob;
  date: string;
  user: string;
}

const ScreenRecorderPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const currentUser = localStorage.getItem('currentUser');

  const fetchRecordings = async () => {
    if (!currentUser) return;
    const allRecordings = await getAllRecordingsForUser(currentUser);
    setRecordings(allRecordings.reverse()); // Mostrar las más nuevas primero
  };

  useEffect(() => {
    fetchRecordings();
  }, [currentUser]);

  const handleStartRecording = async () => {
    const videoName = prompt("Ingrese un nombre para el video:", `Grabacion-${new Date().toLocaleDateString()}`);
    if (!videoName || !currentUser) return;

    try {
      // Solicitar permiso para grabar pantalla y audio del sistema/pestaña
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
      });

      // Solicitar permiso para grabar audio del micrófono
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      // Combinar las pistas de video y audio en un solo stream
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      
      mediaStreamRef.current = combinedStream;

      // Detener la grabación si el usuario cierra la ventana de compartir
      displayStream.getVideoTracks()[0].addEventListener('ended', handleStopRecording);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9,opus' // Formato de buena calidad y compatibilidad
      });

      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
        const newRecording = {
          name: videoName,
          blob: videoBlob,
          date: new Date().toISOString(),
          user: currentUser,
        };

        addRecording(newRecording).then(fetchRecordings);
      };

      recorder.start();
      setIsRecording(true);

    } catch (error) {
      console.error("Error al iniciar la grabación:", error);
      alert("No se pudo iniciar la grabación. Asegúrate de dar los permisos necesarios.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const handleEdit = (rec: Recording) => {
    setEditingId(rec.id);
    setEditingName(rec.name);
  };

  const handleSaveName = async (id: number) => {
    await updateRecordingName(id, editingName);
    setEditingId(null);
    setEditingName('');
    fetchRecordings();
  };

  const handleDeleteRecording = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta grabación?')) {
      await deleteRecording(id);
      fetchRecordings();
    }
  };

  return (
    <main className="main-content">
      <header className="main-header">
        <h1>Grabar Pantalla</h1>
      </header>
      <div className="recorder-container">
        <div className="recorder-actions">
          {!isRecording ? (
            <button onClick={handleStartRecording} className="button-primary record-btn">
              Iniciar Grabación
            </button>
          ) : (
            <button onClick={handleStopRecording} className="button-secondary record-btn">
              Detener Grabación
            </button>
          )}
        </div>

        <div className="recordings-list-container">
          <h2>Mis Videos</h2>
          {recordings.length > 0 ? (
            <ul className="recordings-list">
              {recordings.map((rec) => {
                const isEditing = editingId === rec.id;
                return (
                  <li key={rec.id} className="recording-item">
                    <div className="recording-info">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editingName} 
                          onChange={(e) => setEditingName(e.target.value)} 
                          className="edit-name-input"
                        />
                      ) : (
                        <span className="recording-name">{rec.name}</span>
                      )}
                      <span className="recording-date">{new Date(rec.date).toLocaleString()}</span>
                    </div>
                    <div className="recording-actions">
                      {isEditing ? (
                        <button onClick={() => handleSaveName(rec.id)} className="button-primary">Guardar</button>
                      ) : (
                        <>
                          <a href={URL.createObjectURL(rec.blob)} target="_blank" rel="noopener noreferrer" className="button-secondary">
                            Ver Video
                          </a>
                          <button onClick={() => handleEdit(rec)} className="button-secondary">Editar</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteRecording(rec.id)} className="button-danger">
                        Eliminar
                      </button>
                      <a href={URL.createObjectURL(rec.blob)} download={`${rec.name}.webm`} className="button-primary download-btn">
                        Descargar
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p>Aún no tienes grabaciones.</p>}
        </div>
      </div>
    </main>
  );
};

export default ScreenRecorderPage;