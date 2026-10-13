import React from 'react';
import { Lightbulb, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';

const AIInsights = () => {
  // Mock insights data
  const insights = {
    predictedSpend: 3150.00,
    topCategory: 'Food 🍔',
    trend: 'down',
    trendPercentage: 12.5,
    warnings: [
      "You're tracking 15% over your usual Entertainment budget.",
      "A recurring subscription for $14.99 was not detected this month."
    ],
    tips: [
      { id: 1, title: "Optimize Subscriptions", text: "You have 3 streaming services. Consolidating could save you $25/mo.", icon: <Lightbulb className="text-yellow-400" /> },
      { id: 2, title: "Dining Out", text: "You've spent $400 on dining this month. Try cooking 2 more meals at home to hit your savings goal.", icon: <Sparkles className="text-purple-400" /> }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="text-emerald-400" /> 
              AI Monthly Forecast
            </h2>
            <p className="text-slate-300">Based on your current spending patterns, you are projected to spend <strong className="text-white">${insights.predictedSpend.toFixed(2)}</strong> by end of month.</p>
          </div>
          <div className="text-right flex-shrink-0">
             <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-medium border border-emerald-500/30">
               <TrendingDown size={18} />
               {insights.trendPercentage}% less than last month
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-400" />
            Budget Warnings
          </h3>
          <ul className="space-y-3">
            {insights.warnings.map((warn, i) => (
              <li key={i} className="flex gap-3 text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <div className="mt-0.5 text-orange-400 flex-shrink-0">•</div>
                <p className="text-sm">{warn}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
           <h3 className="text-lg font-bold mb-4">AI Recommendations</h3>
           <div className="space-y-4">
             {insights.tips.map(tip => (
               <div key={tip.id} className="flex gap-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                 <div className="flex-shrink-0 p-2 bg-slate-800 rounded-full h-fit">
                   {tip.icon}
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-200 text-sm mb-1">{tip.title}</h4>
                   <p className="text-sm text-slate-400 leading-relaxed">{tip.text}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
