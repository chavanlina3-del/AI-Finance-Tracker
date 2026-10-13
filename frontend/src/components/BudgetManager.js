import React, { useState } from 'react';
import { Target, Plus } from 'lucide-react';

const BudgetManager = () => {
  const [budgets, setBudgets] = useState([
    { id: 1, category: 'Food 🍔', limit: 600, spent: 450 },
    { id: 2, category: 'Transport 🚗', limit: 200, spent: 180 },
    { id: 3, category: 'Entertainment 🎬', limit: 300, spent: 320 },
    { id: 4, category: 'Utilities ⚡', limit: 250, spent: 210 }
  ]);

  const getProgressColor = (percent) => {
    if (percent > 100) return 'bg-red-500';
    if (percent > 85) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="text-emerald-500" />
            Monthly Budgets
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage limits for your spending categories</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={18} />
          New Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map(budget => {
          const percent = (budget.spent / budget.limit) * 100;
          const isOver = percent > 100;
          
          return (
            <div key={budget.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-lg">{budget.category}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    <span className={isOver ? 'text-red-400 font-bold' : 'text-slate-200 font-medium'}>
                      ${budget.spent.toFixed(2)}
                    </span>
                    {' '}of ${budget.limit.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                    isOver ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {percent.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700/50">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${getProgressColor(percent)}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                ></div>
              </div>
              
              {isOver && (
                <p className="text-xs text-red-400 mt-3 font-medium">
                  Over budget by ${(budget.spent - budget.limit).toFixed(2)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetManager;
