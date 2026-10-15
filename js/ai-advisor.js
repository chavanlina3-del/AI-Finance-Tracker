/**
 * FinAI - Intelligent Heuristics & Financial Advisory Engine
 * Generates automated spending audits, burn rate projections, and context-aware AI chat responses
 */

// Generate real-time insights based on live financial numbers
function generateAIInsights(transactions, budgets, totalIncome, totalExpense) {
  const insights = [];
  const now = new Date();

  // 1. Savings Rate Analysis
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  if (totalIncome > 0) {
    if (savingsRate >= 30) {
      insights.push({
        type: 'success',
        title: 'Outstanding Savings Velocity',
        desc: `Your current savings rate is ${savingsRate.toFixed(1)}%. You are comfortably outpacing standard wealth accumulation benchmarks.`
      });
    } else if (savingsRate >= 15) {
      insights.push({
        type: 'info',
        title: 'Healthy Savings Rate',
        desc: `You are saving ${savingsRate.toFixed(1)}% of your income. Increasing this by just 5% would boost your annual reserves significantly.`
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: 'warning',
        title: 'Tight Savings Margin',
        desc: `Your current savings margin is ${savingsRate.toFixed(1)}%. Consider trimming non-essential recurring subscriptions to build a larger safety cushion.`
      });
    } else {
      insights.push({
        type: 'danger',
        title: 'Deficit Alert',
        desc: `Expenditures exceed income by ${formatCurrency(Math.abs(netSavings))}. Prioritize non-discretionary expenses until cash flow normalizes.`
      });
    }
  }

  // 2. Category Concentration Anomaly
  const expenses = transactions.filter(t => t.type === 'EXPENSE');
  const catSums = {};
  expenses.forEach(tx => {
    const cat = tx.category || 'Other';
    catSums[cat] = (catSums[cat] || 0) + (Number(tx.amount) || 0);
  });

  let highestCat = '';
  let highestVal = 0;
  for (const [cat, val] of Object.entries(catSums)) {
    if (val > highestVal) {
      highestVal = val;
      highestCat = cat;
    }
  }

  if (highestVal > 0 && totalExpense > 0) {
    const pct = ((highestVal / totalExpense) * 100).toFixed(0);
    if (pct > 35) {
      insights.push({
        type: 'warning',
        title: `Heavy ${highestCat} Weighting`,
        desc: `${highestCat} accounts for ${pct}% (${formatCurrency(highestVal)}) of your total spending. Rebalancing could unlock direct monthly savings.`
      });
    }
  }

  // 3. Budget Limits Check
  if (Array.isArray(budgets) && budgets.length > 0) {
    budgets.forEach(b => {
      const spent = catSums[b.category] || 0;
      const ratio = spent / b.limit;
      if (ratio >= 1.0) {
        insights.push({
          type: 'danger',
          title: `Budget Exceeded: ${b.category}`,
          desc: `You've spent ${formatCurrency(spent)} against your ${formatCurrency(b.limit)} limit (${(ratio * 100).toFixed(0)}%). Further spending will impact your savings goal.`
        });
      } else if (ratio >= 0.8) {
        insights.push({
          type: 'warning',
          title: `Budget Approaching Cap: ${b.category}`,
          desc: `${b.category} is at ${(ratio * 100).toFixed(0)}% of limit. Only ${formatCurrency(b.limit - spent)} remaining for the cycle.`
        });
      }
    });
  }

  // Fallback tip if sparse transactions
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Smart Capital Allocation',
      desc: 'Follow the 50/30/20 guideline: 50% for Needs, 30% for Wants, and 20% for Savings and Debt Reduction.'
    });
  }

  return insights;
}

// Render insights on the AI Coach view and top dashboard banner
function renderAIInsightsUI(transactions, budgets, totalIncome, totalExpense) {
  const insights = generateAIInsights(transactions, budgets, totalIncome, totalExpense);

  // Top banner update
  const topHeadline = document.getElementById('top-insight-headline');
  const topText = document.getElementById('top-insight-text');
  if (topHeadline && topText && insights.length > 0) {
    topHeadline.textContent = insights[0].title;
    topText.textContent = insights[0].desc;
  }

  // Sidebar tip
  const sidebarTip = document.getElementById('sidebar-smart-tip');
  if (sidebarTip && insights.length > 1) {
    sidebarTip.textContent = insights[1].desc;
  }

  // Full AI view list
  const listContainer = document.getElementById('ai-insights-list');
  if (listContainer) {
    listContainer.innerHTML = insights.map(item => `
      <div class="ai-insight-item type-${item.type}">
        <h5>${item.title}</h5>
        <p>${item.desc}</p>
      </div>
    `).join('');
  }

  // Month-end Forecast Box
  const forecastBox = document.getElementById('forecast-box');
  if (forecastBox) {
    const today = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysPassed = Math.max(1, today);
    const dailyBurn = totalExpense / daysPassed;
    const projectedMonthExpense = dailyBurn * daysInMonth;
    const projectedNet = totalIncome - projectedMonthExpense;

    forecastBox.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>Daily Average Outflow:</strong> ${formatCurrency(dailyBurn)}/day
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Estimated Month-End Total Spend:</strong> ${formatCurrency(projectedMonthExpense)}
      </div>
      <div>
        <strong>Projected End-of-Month Surplus:</strong> 
        <span class="${projectedNet >= 0 ? 'text-success' : 'text-danger'}">
          ${formatCurrency(projectedNet)}
        </span>
      </div>
    `;
  }
}

// Chatbot Heuristic Response Generator
function generateAIChatReply(userPrompt, state) {
  const prompt = userPrompt.toLowerCase();
  const { totalIncome, totalExpense, transactions, budgets, goals } = state;
  const netSavings = totalIncome - totalExpense;

  // 1. How to save money / save $X
  if (prompt.includes('save') && (prompt.includes('how') || prompt.includes('more') || prompt.includes('$'))) {
    const foodSum = transactions
      .filter(t => t.type === 'EXPENSE' && t.category === 'Food & Dining')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const entSum = transactions
      .filter(t => t.type === 'EXPENSE' && t.category === 'Entertainment')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    return `Here are 3 tailored actions based on your transactions:
1. **Food & Dining Optimization:** You've spent ${formatCurrency(foodSum)} in dining. Cutting takeout meals by just 2 times per week will save an estimated ${formatCurrency(120)}/month.
2. **Entertainment & Subscriptions:** Entertainment is currently at ${formatCurrency(entSum)}. Auditing unused subscriptions could immediately free up ${formatCurrency(40)}–${formatCurrency(80)}.
3. **Automate Transfers:** Set up an automatic transfer of 10% of every paycheck directly to your savings on payday.`;
  }

  // 2. Biggest expense category
  if (prompt.includes('biggest') || prompt.includes('highest') || prompt.includes('most spent')) {
    const catMap = {};
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount || 0);
    });
    let topCat = 'None';
    let topAmt = 0;
    for (const [c, a] of Object.entries(catMap)) {
      if (a > topAmt) { topAmt = a; topCat = c; }
    }
    const pct = totalExpense > 0 ? ((topAmt / totalExpense) * 100).toFixed(1) : 0;
    return `Your single highest expenditure category is **${topCat}**, totaling **${formatCurrency(topAmt)}** (${pct}% of your total expenses).`;
  }

  // 3. 50/30/20 breakdown
  if (prompt.includes('50/30/20') || prompt.includes('breakdown') || prompt.includes('rule')) {
    const needs = totalIncome * 0.50;
    const wants = totalIncome * 0.30;
    const savings = totalIncome * 0.20;

    return `Using the proven **50/30/20 rule** on your current income of **${formatCurrency(totalIncome)}**:
- **50% Needs (Housing, Utilities, Groceries):** Target ${formatCurrency(needs)}
- **30% Wants (Dining, Entertainment, Shopping):** Target ${formatCurrency(wants)}
- **20% Savings & Debt Acceleration:** Target ${formatCurrency(savings)}
Currently your total monthly spending is **${formatCurrency(totalExpense)}**, leaving a balance of **${formatCurrency(netSavings)}**.`;
  }

  // 4. Budget check
  if (prompt.includes('budget') || prompt.includes('on track')) {
    if (!budgets || budgets.length === 0) {
      return `You haven't configured category budgets yet! Navigate to the **Budgets & Limits** tab and set limits for your main expenses like Food, Housing, and Shopping.`;
    }
    let statusSummary = [];
    budgets.forEach(b => {
      const spent = transactions
        .filter(t => t.type === 'EXPENSE' && t.category === b.category)
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const pct = ((spent / b.limit) * 100).toFixed(0);
      statusSummary.push(`- **${b.category}**: ${formatCurrency(spent)} of ${formatCurrency(b.limit)} (${pct}%)`);
    });
    return `Here is your current budget status:\n` + statusSummary.join('\n');
  }

  // 5. Income / Net Worth / Balance
  if (prompt.includes('income') || prompt.includes('earn') || prompt.includes('balance') || prompt.includes('net')) {
    return `Your recorded monthly income is **${formatCurrency(totalIncome)}** against expenses of **${formatCurrency(totalExpense)}**, resulting in a net monthly surplus of **${formatCurrency(netSavings)}**.`;
  }

  // Default intelligent assistant response
  return `Based on your live account data, you have **${transactions.length} transactions** logged with a net monthly cash flow of **${formatCurrency(netSavings)}**. 
Try asking me:
- *"How can I save $200 this month?"*
- *"What is my biggest expense category?"*
- *"Give me a 50/30/20 breakdown"*
- *"Am I on track with my budget?"*`;
}
