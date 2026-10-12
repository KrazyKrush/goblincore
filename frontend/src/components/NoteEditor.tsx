import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Note, Transaction } from '../types';

interface NoteEditorProps {
  noteId: number | null;
  onNoteUpdate: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, onNoteUpdate }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [isIncome, setIsIncome] = useState(false);
  const [amount, setAmount] = useState('');
  const [organization, setOrganization] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);

  const loadNote = async (id: number) => {
    const res = await api.get('/notes/');
    const foundNote = res.data.find((n: Note) => n.id === id);
    if (foundNote) {
      setNote(foundNote);
      setTitle(foundNote.title);
      setContent(foundNote.content);
      setTransactions(foundNote.transactions || []);
    }
  };

  useEffect(() => {
    if (noteId) {
      loadNote(noteId);
    }
  }, [noteId]);

  const handleSaveNote = async () => {
    if (!noteId) return;
    try {
      await api.put(`/notes/${noteId}`, { title, content });
      onNoteUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // === Открыть модалку для НОВОЙ транзакции ===
  const openNewTransactionModal = () => {
    setEditingTransactionId(null);
    setIsIncome(false);
    setAmount('');
    setOrganization('');
    setShowModal(true);
  };

  // === Открыть модалку для РЕДАКТИРОВАНИЯ ===
  const openEditTransactionModal = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setIsIncome(t.is_income);
    setAmount(String(t.amount));
    setOrganization(t.organization);
    setShowModal(true);
  };

  // === Сохранить (создать или обновить) ===
  const handleSaveTransaction = async () => {
    if (!noteId) {
      alert('Сначала сохраните заметку');
      return;
    }
    if (!amount || !organization) {
      alert('Заполните сумму и компанию');
      return;
    }

    try {
      const payload = {
        is_income: isIncome,
        amount: parseFloat(amount),
        organization,
      };

      if (editingTransactionId) {
        // 👇 ОБНОВЛЕНИЕ: /notes/transactions/{id}
        await api.put(`/notes/transactions/${editingTransactionId}`, payload);
      } else {
        // 👇 СОЗДАНИЕ: /notes/{note_id}/transactions
        await api.post(`/notes/${noteId}/transactions`, payload);
      }

      await loadNote(noteId);
      onNoteUpdate();

      setShowModal(false);
      setEditingTransactionId(null);
      setAmount('');
      setOrganization('');
      setIsIncome(false);
    } catch (err: any) {
      console.error('❌ Ошибка:', err);
      alert('Ошибка: ' + (err.response?.data?.detail || err.message));
    }
  };

  // === УДАЛЕНИЕ ТРАНЗАКЦИИ ===
  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Удалить эту запись?')) return;
    try {
      // 👇 ПРАВИЛЬНЫЙ URL: /notes/transactions/{id}
      await api.delete(`/notes/transactions/${id}`);
      if (noteId) await loadNote(noteId);
      onNoteUpdate();
    } catch (err: any) {
      console.error('❌ Ошибка удаления транзакции:', err);
      alert('Не удалось удалить запись: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (!noteId || !note) {
    return <div className="empty-state">Выберите заметку или создайте новую</div>;
  }

  return (
    <div className="note-editor">
      <div className="editor-header">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveNote}
          className="title-input"
          placeholder="Без названия"
        />
        <div className="editor-actions">
          <button className="icon-btn" onClick={() => {}}>B</button>
          <button className="icon-btn" onClick={() => {}}>I</button>
          <button className="report-btn" onClick={openNewTransactionModal}>
            Добавить отчет
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleSaveNote}
        className="content-area"
        placeholder="Начните писать..."
      />

      {transactions.length > 0 && (
        <div className="transactions-list">
          <h4 className="transactions-title">Транзакции в этой заметке:</h4>
          {transactions.map((t) => (
            <div
              key={t.id}
              className={`transaction-item ${t.is_income ? 'income' : 'expense'}`}
            >
              <span className="transaction-icon">
                {t.is_income ? '💰' : '💸'}
              </span>
              <span className="transaction-company">{t.organization}</span>
              <span className="transaction-separator">|</span>
              <span className="transaction-type">
                {t.is_income ? 'Доход' : 'Расход'}
              </span>
              <span className="transaction-amount">
                {t.amount.toLocaleString('ru-RU')} ₽
              </span>
              <div className="transaction-actions">
                <button
                  className="tx-btn edit"
                  onClick={() => openEditTransactionModal(t)}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  className="tx-btn delete"
                  onClick={() => handleDeleteTransaction(t.id)}
                  title="Удалить"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingTransactionId ? 'Редактировать запись' : 'Новый отчет'}</h3>

            <div className="report-type-toggle">
              <button
                className={!isIncome ? 'active-expense' : ''}
                onClick={() => setIsIncome(false)}
              >
                Расход
              </button>
              <button
                className={isIncome ? 'active-income' : ''}
                onClick={() => setIsIncome(true)}
              >
                Доход
              </button>
            </div>

            <input
              type="number"
              placeholder="Сумма (₽)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              placeholder="Компания / организация"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Отмена
              </button>
              <button className="btn-done" onClick={handleSaveTransaction}>
                {editingTransactionId ? 'Сохранить' : 'Готово'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditor;