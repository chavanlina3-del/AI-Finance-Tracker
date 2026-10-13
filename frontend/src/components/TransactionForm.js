import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api';

const DEFAULT_CATEGORIES = [
  'Housing 🏠', 'Food 🍔', 'Transport 🚗', 'Utilities ⚡', 
  'Insurance 🛡️', 'Healthcare 💊', 'Savings 💰', 'Personal 👤', 
  'Entertainment 🎬', 'Education 📚', 'Salary 💵', 'Other 📝'
];

const TransactionForm = ({ transaction, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: DEFAULT_CATEGORIES[1],
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: new Date(transaction.date).toISOString().split('T')[0]
      });
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = { ...formData, amount: parseFloat(formData.amount) };
      
      // Mock API call
      // if (transaction) {
      //   await api.put(`/transactions/${transaction._id}`, data);
      // } else {
      //   await api.post('/transactions', data);
      // }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      onSaved();
    } catch (err) {
      setError('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xl font-bold">{transaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm">{error}</div>}
          
          <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
            <button
              type="button"
              className={`flex-1 py-2 font-medium transition-colors ${formData.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:bg-slate-800'}`}
              onClick={() => setFormData({...formData, type: 'expense'})}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 font-medium transition-colors ${formData.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
              onClick={() => setFormData({...formData, type: 'income'})}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <input 
              type="text" 
              required 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="What was this for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
            <input 
              type="date" 
              required 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
