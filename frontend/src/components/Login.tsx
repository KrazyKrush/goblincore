import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import '../index.css'; // Предполагаем, что стили здесь

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await api.post('/auth/register', { username, password });
        // После регистрации сразу логиним
      }
      
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await api.post('/auth/login', formData);
      login(response.data.access_token);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка авторизации');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegister ? 'Регистрация' : 'Вход'}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Логин" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
        </form>
        <p onClick={() => setIsRegister(!isRegister)} className="toggle-auth">
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </p>
      </div>
    </div>
  );
};

export default Login;