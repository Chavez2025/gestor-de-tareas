// Primero, importamos las herramientas que vamos a necesitar de React.
import React, { useState, useRef, useEffect } from 'react';
// También traemos las funciones que hicimos para hablar con la base de datos del navegador (IndexedDB).
import { addRecording, getAllRecordingsForUser, updateRecordingName, deleteRecording } from './db';

// Aquí definimos cómo se ve un objeto de "Grabación". Es como un plano o un contrato.
interface Recording {
  id: number; // Un número único para identificar cada video.
  name: string; // El nombre que el usuario le puso al video.
  blob: Blob; // Aquí se guarda el video en sí, como un archivo binario.
  date: string; // La fecha en que se grabó.
  user: string; // Para saber a qué usuario le pertenece este video.
}

// Este es nuestro componente principal para la página de grabación.
const ScreenRecorderPage: React.FC = () => {
  // --- ESTADOS Y REFERENCIAS ---
  // Un estado para saber si estamos grabando o no. Así podemos cambiar el texto del botón.
  const [isRecording, setIsRecording] = useState(false);
  // Aquí vamos a guardar la lista de videos grabados para mostrarlos en pantalla.
  const [recordings, setRecordings] = useState<Recording[]>([]);
  // Estados para cuando el usuario quiera editar el nombre de un video.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  // Las "referencias" son como cajas para guardar cosas que no queremos que se pierdan entre renders.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  // Aquí vamos juntando los pedacitos del video mientras se graba.
  const recordedChunksRef = useRef<Blob[]>([]);
  // Para no perder el nombre que el usuario le pone al video al inicio.
  const videoNameRef = useRef<string>('');
  // Necesitamos saber quién es el usuario para guardar y mostrar solo sus videos.
  const currentUser = localStorage.getItem('currentUser');

  // --- FUNCIONES ---
  // Esta función va a la base de datos local y trae todos los videos del usuario actual.
  const fetchRecordings = async () => {
    if (!currentUser) return;
    const allRecordings = await getAllRecordingsForUser(currentUser);
    setRecordings(allRecordings.reverse()); // Le damos la vuelta para que los videos más nuevos aparezcan arriba.
  };

  // Esto se ejecuta solo una vez, cuando el componente se carga por primera vez.
  useEffect(() => {
    fetchRecordings();
  }, [currentUser]);

  // La función principal que se ejecuta cuando el usuario le da a "Iniciar Grabación".
  const handleStartRecording = async () => {
    // Primero, le preguntamos al usuario qué nombre le quiere poner al video.
    const name = prompt("Ingrese un nombre para el video:", `Grabacion-${new Date().toLocaleDateString()}`);
    if (!name || !currentUser) return;

    videoNameRef.current = name; // Guardamos ese nombre en nuestra "cajita" de referencia.
    recordedChunksRef.current = []; // Limpiamos los pedazos de la grabación anterior, por si acaso.

    try {
      // Paso 1: Le pedimos permiso al navegador para grabar la pantalla.
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true, // Capturar audio de la pestaña/sistema si es posible
      });

      // Paso 2: Ahora pedimos permiso para usar el micrófono.
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      // Paso 3: Juntamos el video de la pantalla y el audio del micrófono en un solo "stream".
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      
      mediaStreamRef.current = combinedStream;

      // Paso 4: Creamos el objeto MediaRecorder, que es el que realmente hace la grabación.
      const options = { mimeType: 'video/webm; codecs=vp9,opus' };
      let recorder;
      // Verificamos si el navegador soporta nuestro formato preferido (de alta calidad).
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        recorder = new MediaRecorder(combinedStream, options);
      } else {
        // Si no lo soporta, dejamos que el navegador elija el formato por defecto. Esto da más compatibilidad.
        recorder = new MediaRecorder(combinedStream);
      }
      mediaRecorderRef.current = recorder;

      // Cuando el grabador tiene un pedacito de video listo, nos lo da aquí.
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data); // Y lo guardamos en nuestra lista de pedacitos.
        }
      };

      // Cuando la grabación se detiene, se ejecuta esto.
      recorder.onstop = async () => {
        // Juntamos todos los pedacitos para formar el video completo.
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        // Guardamos el video en la base de datos con su nombre, fecha y usuario.
        await addRecording({
          name: videoNameRef.current,
          blob: videoBlob,
          date: new Date().toISOString(),
          user: currentUser!,
        });
        await fetchRecordings(); // Actualizamos la lista de videos en pantalla.
        // Muy importante: liberamos los recursos de la cámara y micrófono.
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      };

      // Paso 5: ¡Empezamos a grabar!
      recorder.start();
      setIsRecording(true);

      // Esto es por si el usuario detiene la grabación desde el botón del navegador, no el nuestro.
      const videoTrack = displayStream.getVideoTracks()[0];
      videoTrack.onended = () => handleStopRecording();
      
    } catch (error) {
      console.error("Error al iniciar la grabación:", error);
      alert("No se pudo iniciar la grabación. Asegúrate de dar los permisos necesarios.");
      setIsRecording(false); // Si algo falla, reseteamos el estado del botón.
    }
  };

  // Esta función se llama cuando el usuario hace clic en "Detener Grabación".
  const handleStopRecording = () => {
    // Solo le decimos al grabador que se detenga si está grabando.
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false); // Actualizamos el estado para que el botón cambie.
  };

  // Cuando el usuario le da al botón de "Editar".
  const handleEdit = (rec: Recording) => {
    setEditingId(rec.id);
    setEditingName(rec.name);
  };

  // Cuando el usuario guarda el nuevo nombre del video.
  const handleSaveName = async (id: number) => {
    await updateRecordingName(id, editingName);
    setEditingId(null);
    setEditingName('');
    fetchRecordings();
  };

  // Para borrar una grabación.
  const handleDeleteRecording = async (id: number) => {
    // Siempre es bueno preguntar antes de borrar algo permanentemente.
    if (window.confirm('¿Estás seguro de que quieres eliminar esta grabación?')) {
      await deleteRecording(id);
      fetchRecordings();
    }
  };

  // --- RENDERIZADO DEL COMPONENTE (Lo que se ve en pantalla) ---
  return (
    <main className="main-content">
      <header className="main-header">
        <h1>Grabar Pantalla</h1>
      </header>
      <div className="recorder-container">
        <div className="recorder-actions">
          {/* Aquí decidimos qué botón mostrar: "Iniciar" o "Detener" */}
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
          {/* Si hay videos, los mostramos en una lista. Si no, un mensaje. */}
          {recordings.length > 0 ? (
            <ul className="recordings-list">
              {recordings.map((rec) => {
                const isEditing = editingId === rec.id;
                return (
                  <li key={rec.id} className="recording-item">
                    <div className="recording-info">
                      {/* Si estamos editando, mostramos un campo de texto. Si no, el nombre normal. */}
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
                      {/* Lo mismo para los botones: "Guardar" o el resto de acciones. */}
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
                      {/* Este enlace permite descargar el video directamente. */}
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