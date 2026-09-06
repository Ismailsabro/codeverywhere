import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api';

const STATUS_COLORS = { pending: '#eab308', in_progress: '#3b82f6', done: '#16a34a' };

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (!stats) return null;

  const tasksPerEmployeeData = stats.tasks.perEmployee.map(e => ({ name: e.name, count: e.count }));
  const tasksByStatusData = Object.entries(stats.tasks.byStatus).map(([status, count]) => ({
    status, count, label: t(`tasks.status.${status}`)
  }));

  return (
    <div>
      <div className="page-header"><h1>📊 {t('dashboard.title')}</h1><p>{t('dashboard.subtitle')}</p></div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.employees.total}</div>
          <div className="stat-label">{t('dashboard.stats.totalEmployees')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.employees.byStatus.active || 0}</div>
          <div className="stat-label">{t('dashboard.stats.activeEmployees')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.tasks.total}</div>
          <div className="stat-label">{t('dashboard.stats.totalTasks')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.messages.today}</div>
          <div className="stat-label">{t('dashboard.stats.messagesToday')}</div>
        </div>
      </div>

      <div className="chart-panels">
        <div className="chart-panel">
          <h3>{t('dashboard.charts.tasksPerEmployee')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tasksPerEmployeeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-panel">
          <h3>{t('dashboard.charts.tasksByStatus')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={tasksByStatusData} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                {tasksByStatusData.map(entry => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
