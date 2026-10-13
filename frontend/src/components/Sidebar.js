import React from 'react';
import { LayoutDashboard, Receipt, Brain, WalletCards } from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt size={20} /> },
    { id: 'insights', label: 'AI Insights', icon: <Brain size={20} /> },
    { id: 'budgets', label: 'Budgets', icon: <WalletCards size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
          <Brain className="text-emerald-500" /> AI Finance
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === item.id 
                ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 text-sm text-slate-500">
        &copy; 2026 AI Finance Tracker
      </div>
    </div>
  );
};

export default Sidebar;
