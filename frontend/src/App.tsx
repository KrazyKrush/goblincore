import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import StatsCard from './components/StatsCard';
import NoteEditor from './components/NoteEditor';
import api from './api/axios';
import { Note } from './types';
import './index.css';

const MainApp: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // === Загрузка списка заметок ===
  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes/');
      setNotes(res.data);
      if (res.data.length > 0 && !selectedNoteId) {
        setSelectedNoteId(res.data[0].id);
      }
      // Если выбранная заметка удалена — переключаемся на первую
      if (selectedNoteId && !res.data.find((n: Note) => n.id === selectedNoteId)) {
        setSelectedNoteId(res.data.length > 0 ? res.data[0].id : null);
      }
    } catch (err) {
      console.error('Ошибка загрузки заметок:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
    }
  }, [isAuthenticated]);

  // === Создание новой заметки ===
  const handleCreateNote = async () => {
    try {
      const res = await api.post('/notes/', {
        title: 'Без названия',
        content: '',
      });
      setNotes([res.data, ...notes]);
      setSelectedNoteId(res.data.id);
    } catch (err) {
      console.error('Ошибка создания заметки:', err);
      alert('Не удалось создать заметку');
    }
  };

  // === Удаление заметки (вместе со всеми транзакциями) ===
  const handleDeleteNote = async (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // не выбирать заметку при клике на крестик

    if (!window.confirm('Удалить заметку и все её записи?')) return;

    try {
      await api.delete(`/notes/${noteId}`);
      const newNotes = notes.filter((n) => n.id !== noteId);
      setNotes(newNotes);

      // Если удалили активную — переключаемся на первую или сбрасываем
      if (selectedNoteId === noteId) {
        setSelectedNoteId(newNotes.length > 0 ? newNotes[0].id : null);
      }
    } catch (err) {
      console.error('Ошибка удаления заметки:', err);
      alert('Не удалось удалить заметку');
    }
  };

  // === Выход из аккаунта ===
  const handleLogout = () => {
    setShowProfileMenu(false);
    setNotes([]);
    setSelectedNoteId(null);
    logout();
  };

  // === Если не авторизован — показываем форму входа ===
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* ===== ЛЕВАЯ ПАНЕЛЬ ===== */}
      <div className="sidebar">
        <button className="new-note-btn" onClick={handleCreateNote}>
          + Новый расчет
        </button>

        <div className="notes-list">
          {notes.length === 0 && (
            <div className="empty-notes-hint">
              Нет заметок. Нажмите «+ Новый расчет», чтобы создать первую.
            </div>
          )}

          {notes.map((note) => (
            <div
              key={note.id}
              className={`note-item ${selectedNoteId === note.id ? 'active' : ''}`}
              onClick={() => setSelectedNoteId(note.id)}
            >
              <div className="note-title">{note.title}</div>
              <div className="note-date">
                {new Date(note.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                {new Date(note.created_at).toLocaleDateString()}
              </div>
              <button
                className="delete-note-btn"
                onClick={(e) => handleDeleteNote(note.id, e)}
                title="Удалить заметку"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ПРАВАЯ ПАНЕЛЬ ===== */}
      <div className="main-content">
        <div className="top-bar">
          <div
  className="user-avatar"
  onClick={() => setShowProfileMenu(!showProfileMenu)}
>
  <img src="/pictures/avatar.jpg" alt="Аватар" className="avatar-img" />
</div>
          {showProfileMenu && (
            <div className="profile-dropdown">
              <button onClick={handleLogout}>Выйти из аккаунта</button>
            </div>
          )}
        </div>

        <div className="content-area-scroll">
          <StatsCard />
          <NoteEditor noteId={selectedNoteId} onNoteUpdate={fetchNotes} />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;