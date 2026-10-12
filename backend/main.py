import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from database import engine, Base
import models  # <-- ВАЖНО: импортируем модели, чтобы они зарегистрировались в Base
from routers import auth_router, notes_router

# Функция для создания таблиц с ретраями (на случай, если БД ещё не готова)
def init_db(retries: int = 10, delay: int = 3):
    for attempt in range(1, retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            print(f"✅ Таблицы созданы успешно (попытка {attempt})")
            return
        except OperationalError as e:
            print(f"⏳ Попытка {attempt}/{retries}: БД не готова, ждём {delay} сек...")
            time.sleep(delay)
    raise RuntimeError("❌ Не удалось подключиться к БД после всех попыток")

# Создаём таблицы при старте
init_db()

app = FastAPI(title="Goblincore API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(notes_router.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Goblincore API"}