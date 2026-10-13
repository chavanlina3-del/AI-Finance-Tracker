import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, Trash2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api';

const TransactionList = ({ onEdit }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Mock Data
      setTimeout(() => {
        const mockData = Array.from({ length: 45 }).map((_, i) => ({
          _id: `t_${i}`,
          type: Math.random() > 0.3 ? 'expense' : 'income',
          amount: +(Math.random() * 500 + 10).toFixed(2),
          category: ['Food 🍔', 'Transport 🚗', 'Utilities ⚡', 'Salary 💰'][Math.floor(Math.random() * 4)],
          description: `Transaction ${i + 1}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        })).sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(mockData);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      // Mock API delete
      setTransactions(transactions.filter(t => t._id !== id));
    }
  };

  const filteredData = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm appearance-none"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredData.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50 sticky top-0 backdrop-blur-sm">
              <tr>
                <th className="p-4 font-medium text-slate-400 text-sm">Date</th>
                <th className="p-4 font-medium text-slate-400 text-sm">Description</th>
                <th className="p-4 font-medium text-slate-400 text-sm">Category</th>
                <th className="p-4 font-medium text-slate-400 text-sm text-right">Amount</th>
                <th className="p-4 font-medium text-slate-400 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((t) => (
                <tr key={t._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors group">
                  <td className="p-4 text-sm whitespace-nowrap">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
                  <td className="p-4 text-sm font-medium">{t.description}</td>
                  <td className="p-4 text-sm">
                    <span className="bg-slate-700 px-2 py-1 rounded-md text-xs">{t.category}</span>
                  </td>
                  <td className={`p-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(t)} className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded-md transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(t._id)} className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <AlertCircle size={48} className="text-slate-600" />
            <p>No transactions found matching your criteria</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing <span className="font-medium text-slate-200">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-slate-200">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium text-slate-200">{filteredData.length}</span> results
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
