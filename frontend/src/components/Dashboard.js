import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import api from '../api';
import { format } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [data, setData] = useState({
    summary: { totalIncome: 0, totalExpenses: 0, netBalance: 0, savingRate: 0 },
    expensesByCategory: [],
    monthlyTrend: [],
    dailyTrend: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Using mock data for initial frontend build if API is not yet running
        // const response = await api.get('/dashboard');
        // setData(response.data);
        
        // Mock fallback
        setTimeout(() => {
          setData({
            summary: { totalIncome: 5200.00, totalExpenses: 2850.50, netBalance: 2349.50, savingRate: 45.2 },
            expensesByCategory: [
              { name: 'Housing', value: 1200 },
              { name: 'Food', value: 600 },
              { name: 'Transport', value: 300 },
              { name: 'Utilities', value: 250 },
              { name: 'Entertainment', value: 500 }
            ],
            monthlyTrend: [
              { month: 'Apr', income: 4800, expense: 2900 },
              { month: 'May', income: 5000, expense: 3100 },
              { month: 'Jun', income: 4900, expense: 2800 },
              { month: 'Jul', income: 5100, expense: 2600 },
              { month: 'Aug', income: 5100, expense: 3200 },
              { month: 'Sep', income: 5200, expense: 2850 },
            ],
            dailyTrend: [
              { date: '01', amount: 50 }, { date: '05', amount: 120 }, { date: '10', amount: 45 },
              { date: '15', amount: 300 }, { date: '20', amount: 60 }, { date: '25', amount: 90 },
            ],
            recentTransactions: [
              { _id: '1', type: 'expense', amount: 45.90, category: 'Food 🍔', description: 'Groceries', date: new Date().toISOString() },
              { _id: '2', type: 'expense', amount: 12.50, category: 'Transport 🚗', description: 'Uber', date: new Date(Date.now() - 86400000).toISOString() },
              { _id: '3', type: 'income', amount: 2500, category: 'Salary 💰', description: 'Paycheck', date: new Date(Date.now() - 172800000).toISOString() },
              { _id: '4', type: 'expense', amount: 120, category: 'Utilities ⚡', description: 'Electric Bill', date: new Date(Date.now() - 259200000).toISOString() },
              { _id: '5', type: 'expense', amount: 60, category: 'Entertainment 🎬', description: 'Movie night', date: new Date(Date.now() - 345600000).toISOString() }
            ]
          });
          setLoading(false);
        }, 800);
      } catch (err) {
        setError('Failed to load dashboard data. Is the backend running?');
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  if (error) return <div className="p-4 bg-red-500/20 text-red-400 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Income</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">${data.summary.totalIncome.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="text-emerald-500" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">${data.summary.totalExpenses.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <TrendingDown className="text-red-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Net Balance</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">${data.summary.netBalance.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <DollarSign className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Saving Rate</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{data.summary.savingRate}%</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Target className="text-purple-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Bar Chart */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-4">Income vs Expenses (Last 6 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-4">Expenses by Category</h3>
          <div className="h-72">
            {data.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No expense data available</div>
            )}
          </div>
        </div>

        {/* Daily Spending Trend */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-4">Daily Spending Trend (This Month)</h3>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {data.recentTransactions.length > 0 ? (
              data.recentTransactions.map(t => (
                <div key={t._id} className="flex justify-between items-center p-3 hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-slate-600">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <div className="flex gap-2 text-xs text-slate-400">
                        <span>{t.category}</span>
                        <span>•</span>
                        <span>{format(new Date(t.date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">No recent transactions</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
