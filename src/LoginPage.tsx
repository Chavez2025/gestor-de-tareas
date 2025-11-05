import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  password: string;
  email: string;
}

interface LoginPageProps {
  onLogin: (username: string) => void;
  getUsers: () => { [key: string]: User };
  saveUsers: (users: { [key: string]: User }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, getUsers, saveUsers }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const users = getUsers();

    if (isLoginView) {
      // Lógica de Login
      const userExists = Object.values(users).some(user => user.email === username);
      const userAccount = users[username] || Object.values(users).find(user => user.email === username);
      const storedUsername = Object.keys(users).find(key => users[key] === userAccount);

      if (userAccount && userAccount.password === password && storedUsername) {
        onLogin(storedUsername);
        navigate('/hoy'); // Redirige a la página principal
      } else if (!userAccount) {
        alert('Usuario no encontrado. Por favor, regístrese.');
      } else {
        alert('Contraseña incorrecta.');
      }
    } else {
      // Lógica de Creqeu ar Usuario
      if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
      }
      if (users[username]) {
        alert('El usuario ya existe. Por favor, inicie sesión.');
        return;
      }
      if (Object.values(users).some(user => user.email === email)) {
        alert('El correo electrónico ya está en uso.');
        return;
      }
      // Guardar el nuevo usuario
      const updatedUsers = { ...users, [username]: { password, email } };
      saveUsers(updatedUsers);
      alert(`¡Usuario "${username}" creado con éxito! Ahora puede iniciar sesión.`);
      setIsLoginView(true); // Cambiar a la vista de login
    }
  };

  return (
    <main className="main-content login-page-content">
      <div className="login-container">
        <h2>{isLoginView ? 'Login' : 'Crear Usuario'}</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="username">{isLoginView ? 'Ingresa Correo Electrónico o Usuario' : 'Usuario'}</label>
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          {!isLoginView && (
            <div className="form-field">
              <label htmlFor="email">Correo Electrónico</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          )}
          <div className="form-field">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          {!isLoginView && (
            <div className="form-field">
              <label htmlFor="confirm-password">Confirmar Contraseña</label>
              <input 
                type="password" 
                id="confirm-password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
          )}
          <button type="submit" className="button-primary">
            {isLoginView ? 'Ingresar' : 'Crear Usuario'}
          </button>
        </form>

        <div className="view-toggle">
          {isLoginView ? (
            <span>
              ¿No tienes una cuenta?{' '}
              <button onClick={() => setIsLoginView(false)}>
                Crea una
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tienes una cuenta?{' '}
              <button onClick={() => setIsLoginView(true)}>
                Ingresa aquí
              </button>
            </span>
          )}
        </div>
      </div>
    </main>
  );
};

export default LoginPage;