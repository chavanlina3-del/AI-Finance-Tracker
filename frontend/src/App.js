import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AIInsights from './components/AIInsights';
import BudgetManager from './components/BudgetManager';
import TransactionForm from './components/TransactionForm';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionList onEdit={(t) => { setTransactionToEdit(t); setIsTransactionFormOpen(true); }} />;
      case 'insights':
        return <AIInsights />;
      case 'budgets':
        return <BudgetManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onAddTransaction={() => { setTransactionToEdit(null); setIsTransactionFormOpen(true); }}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex justify-between items-center p-6 bg-slate-800 border-b border-slate-700">
          <h1 className="text-2xl font-bold capitalize">{currentView === 'insights' ? 'AI Insights' : currentView}</h1>
          <button 
            onClick={() => { setTransactionToEdit(null); setIsTransactionFormOpen(true); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
          >
            + Add Transaction
          </button>
        </header>
        
        <div className="flex-1 overflow-auto p-6 bg-slate-900">
          {renderView()}
        </div>
      </main>

      {isTransactionFormOpen && (
        <TransactionForm 
          transaction={transactionToEdit}
          onClose={() => setIsTransactionFormOpen(false)}
          onSaved={() => {
            setIsTransactionFormOpen(false);
            // In a real app we might trigger a global refetch here, or let components poll/listen
          }}
        />
      )}
    </div>
  );
}

export default App;
