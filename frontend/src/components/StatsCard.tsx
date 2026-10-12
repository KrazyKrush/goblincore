import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector
} from 'recharts';

interface CompanyStats {
  company: string;
  total_income: number;
  total_expense: number;
}

interface Stats {
  total_income: number;
  total_expense: number;
  balance: number;
  by_company: CompanyStats[];
}

const COLORS_INCOME = ['#66BB6A', '#43A047', '#2E7D32', '#81C784', '#4CAF50'];
const COLORS_EXPENSE = ['#EF5350', '#E53935', '#C62828', '#EF9A9A', '#F44336'];

// Красивый активный сектор (при наведении)
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isIncome = payload[0].name === 'income';
    return (
      <div className="chart-tooltip">
        <div className="company">{data.company}</div>
        <div className="amount">
          {isIncome ? 'Доход' : 'Расход'}: {data.value.toLocaleString('ru-RU')} ₽
        </div>
      </div>
    );
  }
  return null;
};

const StatsCard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    by_company: [],
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchStats = async () => {
    try {
      const res = await api.get('/notes/stats');
      // 👇 ЗАЩИТА: если бэкенд не вернул by_company, подставляем пустой массив
      setStats({
        total_income: res.data.total_income ?? 0,
        total_expense: res.data.total_expense ?? 0,
        balance: res.data.balance ?? 0,
        by_company: res.data.by_company ?? [],
      });
    } catch (err) {
      console.error('Ошибка загрузки статистики', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // 👇 ЗАЩИТА: страховка на случай, если by_company всё же оказался undefined
  const byCompany = stats.by_company ?? [];

  const incomeData = byCompany
    .filter(c => c.total_income > 0)
    .map(c => ({ company: c.company, value: c.total_income }));
  const expenseData = byCompany
    .filter(c => c.total_expense > 0)
    .map(c => ({ company: c.company, value: c.total_expense }));

  const hasData = incomeData.length > 0 || expenseData.length > 0;

  return (
    <div className="stats-card">
      <h3>Общая статистика</h3>

      {!hasData ? (
        <p style={{ color: '#888', padding: '40px 0', textAlign: 'center' }}>
          Пока нет данных. Добавьте первый доход или расход через кнопку «Добавить отчет».
        </p>
      ) : (
        <div className="stats-layout">
          {/* График */}
          <div className="stats-chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={incomeData}
                  dataKey="value"
                  nameKey="company"
                  name="income"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                >
                  {incomeData.map((_, i) => (
                    <Cell key={`inc-${i}`} fill={COLORS_INCOME[i % COLORS_INCOME.length]} />
                  ))}
                </Pie>
                <Pie
                  data={expenseData}
                  dataKey="value"
                  nameKey="company"
                  name="expense"
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={130}
                  paddingAngle={2}
                >
                  {expenseData.map((_, i) => (
                    <Cell key={`exp-${i}`} fill={COLORS_EXPENSE[i % COLORS_EXPENSE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Цифры и легенда */}
          <div className="stats-numbers">
            <p>Доходы: <span className="income">+{stats.total_income.toLocaleString('ru-RU')} ₽</span></p>
            <p>Расходы: <span className="expense">-{stats.total_expense.toLocaleString('ru-RU')} ₽</span></p>
            <p>Баланс: <strong>{stats.balance.toLocaleString('ru-RU')} ₽</strong></p>

            {incomeData.length > 0 && (
              <div style={{ marginTop: 15 }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Доходы по компаниям:</div>
                <div className="chart-legend">
                  {incomeData.map((c, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: COLORS_INCOME[i % COLORS_INCOME.length] }} />
                      <span className="legend-name">{c.company}</span>
                      <span className="legend-value">{c.value.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expenseData.length > 0 && (
              <div style={{ marginTop: 15 }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Расходы по компаниям:</div>
                <div className="chart-legend">
                  {expenseData.map((c, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: COLORS_EXPENSE[i % COLORS_EXPENSE.length] }} />
                      <span className="legend-name">{c.company}</span>
                      <span className="legend-value">{c.value.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;