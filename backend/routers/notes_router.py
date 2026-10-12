from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import auth
from database import get_db


router = APIRouter(prefix="/api/notes", tags=["notes"])


# ============================================================
#  1. СПИСОК ЗАМЕТОК
# ============================================================
@router.get("/", response_model=List[schemas.NoteResponse])
def get_notes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Note)
        .filter(models.Note.user_id == current_user.id)
        .order_by(models.Note.created_at.desc())
        .all()
    )


# ============================================================
#  2. СОЗДАНИЕ ЗАМЕТКИ
# ============================================================
@router.post("/", response_model=schemas.NoteResponse)
def create_note(
    note: schemas.NoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    new_note = models.Note(**note.dict(), user_id=current_user.id)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


# ============================================================
#  3. ДОБАВЛЕНИЕ ТРАНЗАКЦИИ К ЗАМЕТКЕ
# ============================================================
@router.post("/{note_id}/transactions", response_model=schemas.TransactionResponse)
def add_transaction(
    note_id: int,
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    note = (
        db.query(models.Note)
        .filter(models.Note.id == note_id, models.Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    new_transaction = models.Transaction(**transaction.dict(), note_id=note_id)
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction


# ============================================================
#  4. ОБНОВЛЕНИЕ ТРАНЗАКЦИИ
#  ⚠️ ДОЛЖНО БЫТЬ ДО /{note_id}
# ============================================================
@router.put("/transactions/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    transaction = (
        db.query(models.Transaction)
        .join(models.Note, models.Transaction.note_id == models.Note.id)
        .filter(
            models.Transaction.id == transaction_id,
            models.Note.user_id == current_user.id,
        )
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in transaction_update.dict(exclude_unset=True).items():
        setattr(transaction, key, value)

    db.commit()
    db.refresh(transaction)
    return transaction


# ============================================================
#  5. УДАЛЕНИЕ ТРАНЗАКЦИИ
#  ⚠️ ДОЛЖНО БЫТЬ ДО /{note_id}
# ============================================================
@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    transaction = (
        db.query(models.Transaction)
        .join(models.Note, models.Transaction.note_id == models.Note.id)
        .filter(
            models.Transaction.id == transaction_id,
            models.Note.user_id == current_user.id,
        )
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}


# ============================================================
#  6. ОБНОВЛЕНИЕ ЗАМЕТКИ
#  ⚠️ ПОСЛЕ /transactions/{id}
# ============================================================
@router.put("/{note_id}", response_model=schemas.NoteResponse)
def update_note(
    note_id: int,
    note_update: schemas.NoteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    note = (
        db.query(models.Note)
        .filter(models.Note.id == note_id, models.Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    for key, value in note_update.dict(exclude_unset=True).items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)
    return note


# ============================================================
#  7. УДАЛЕНИЕ ЗАМЕТКИ
# ============================================================
@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    note = (
        db.query(models.Note)
        .filter(models.Note.id == note_id, models.Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}


# ============================================================
#  8. ОБЩАЯ СТАТИСТИКА (ПОСЛЕДНИЙ!)
# ============================================================
@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    transactions = (
        db.query(models.Transaction)
        .join(models.Note, models.Transaction.note_id == models.Note.id)
        .filter(models.Note.user_id == current_user.id)
        .all()
    )

    print(f"[STATS] User: {current_user.username}, Transactions found: {len(transactions)}")

    total_income = sum(t.amount for t in transactions if t.is_income)
    total_expense = sum(t.amount for t in transactions if not t.is_income)

    companies: dict = {}
    for t in transactions:
        name = t.organization or "Без названия"
        if name not in companies:
            companies[name] = {
                "company": name,
                "total_income": 0.0,
                "total_expense": 0.0,
            }
        if t.is_income:
            companies[name]["total_income"] += t.amount
        else:
            companies[name]["total_expense"] += t.amount

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "by_company": list(companies.values()),
    }