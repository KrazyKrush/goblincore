FROM node:20-alpine

WORKDIR /app

# Сначала копируем только файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости. Используем npm ci для строгой установки по lock-файлу (быстрее и надежнее)
# Если package-lock.json нет, npm ci упадет, поэтому используем npm install с флагом --no-audit для ускорения
RUN npm install --no-audit --no-fund

# Теперь копируем весь остальной код
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]