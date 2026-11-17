// تحلیل کامل مثل TGJU.org — تکنیکال، تاریخی، پیش‌بینی
export function analyzeHistory(snapshots, currentStats) {
  if (!snapshots || snapshots.length < 2) {
    return {
      hasHistory: false,
      trend: "نامشخص",
      trendColor: "#93a0c4",
      recommendation: "در حال جمع‌آوری داده",
      ma7: currentStats?.avg || 0,
      ma30: currentStats?.avg || 0,
      volatility: 0,
      support: currentStats?.min || 0,
      resistance: currentStats?.max || 0,
      rsi: 50,
      changes: { daily: 0, weekly: 0, monthly: 0 },
      chartData: [],
    };
  }

  const prices = snapshots.map(s => s.avg).filter(Boolean);
  const now = currentStats?.avg || prices[prices.length-1] || 0;
  const first = prices[0] || now;
  
  // Moving Averages
  const ma = (arr, period) => {
    if (arr.length < period) return arr.reduce((a,b)=>a+b,0)/arr.length;
    return arr.slice(-period).reduce((a,b)=>a+b,0)/period;
  };
  const ma7 = ma(prices, 7);
  const ma30 = ma(prices, Math.min(30, prices.length));
  
  // تغییرات
  const last = snapshots[snapshots.length-1];
  const prev = snapshots[snapshots.length-2];
  const weekAgo = snapshots[Math.max(0, snapshots.length-8)];
  const monthAgo = snapshots[Math.max(0, snapshots.length-31)];
  
  const dailyChange = prev?.avg ? ((last.avg - prev.avg)/prev.avg)*100 : 0;
  const weeklyChange = weekAgo?.avg ? ((last.avg - weekAgo.avg)/weekAgo.avg)*100 : 0;
  const monthlyChange = monthAgo?.avg ? ((last.avg - monthAgo.avg)/monthAgo.avg)*100 : 0;
  
  // Volatility (انحراف معیار)
  const avgPrice = prices.reduce((a,b)=>a+b,0)/prices.length;
  const variance = prices.reduce((a,b)=>a+Math.pow(b-avgPrice,2),0)/prices.length;
  const volatility = Math.sqrt(variance) / avgPrice * 100;
  
  // Support / Resistance (کف و سقف تاریخی)
  const support = Math.min(...prices);
  const resistance = Math.max(...prices);
  
  // RSI ساده (بر اساس تغییرات)
  let gains = 0, losses = 0;
  for (let i=1; i<prices.length; i++) {
    const diff = prices[i] - prices[i-1];
    if (diff>0) gains+=diff; else losses+=Math.abs(diff);
  }
  const rs = losses===0 ? 100 : gains/losses;
  const rsi = 100 - (100/(1+rs));
  
  // Trend
  let trend = "خنثی";
  let trendColor = "#fbbf24";
  let recommendation = "نگهداری";
  
  if (now > ma7 && ma7 > ma30 && dailyChange > 0) {
    trend = "صعودی قوی 🚀";
    trendColor = "#34d399";
    recommendation = "خرید — روند صعودی";
  } else if (now > ma7 && dailyChange > 0) {
    trend = "صعودی ملایم 📈";
    trendColor = "#34d399";
    recommendation = "خرید پله‌ای";
  } else if (now < ma7 && ma7 < ma30 && dailyChange < 0) {
    trend = "نزولی قوی 📉";
    trendColor = "#f87171";
    recommendation = "فروش — روند نزولی";
  } else if (now < ma7) {
    trend = "نزولی ملایم";
    trendColor = "#f87171";
    recommendation = "صبر برای کف";
  }
  
  if (rsi > 70) recommendation += " — اشباع خرید (احتیاط)";
  if (rsi < 30) recommendation += " — اشباع فروش (فرصت خرید)";
  
  // پیش‌بینی ساده
  const momentum = dailyChange * 0.3 + weeklyChange * 0.7;
  let forecast = "ثبات";
  if (momentum > 2) forecast = "رشد احتمالی";
  else if (momentum < -2) forecast = "افت احتمالی";
  
  return {
    hasHistory: true,
    trend,
    trendColor,
    recommendation,
    ma7: Math.round(ma7),
    ma30: Math.round(ma30),
    volatility: Math.round(volatility*10)/10,
    support: Math.round(support),
    resistance: Math.round(resistance),
    rsi: Math.round(rsi),
    dailyChange: Math.round(dailyChange*10)/10,
    weeklyChange: Math.round(weeklyChange*10)/10,
    monthlyChange: Math.round(monthlyChange*10)/10,
    changes: {
      daily: Math.round(dailyChange*10)/10,
      weekly: Math.round(weeklyChange*10)/10,
      monthly: Math.round(monthlyChange*10)/10,
    },
    forecast,
    chartData: snapshots.slice(-30).map(s => ({ ts: s.ts, avg: s.avg, min: s.min, max: s.max })),
    lastUpdate: last?.ts || Date.now(),
  };
}

export function generateMarketNews(query, analysis) {
  const news = [];
  const q = query || "این کالا";
  
  if (analysis.dailyChange > 3) {
    news.push({ type: "up", title: `جهش ${analysis.dailyChange}٪ قیمت ${q} در ۲۴ ساعت گذشته`, time: "امروز", impact: "بالا" });
  } else if (analysis.dailyChange < -3) {
    news.push({ type: "down", title: `افت ${Math.abs(analysis.dailyChange)}٪ قیمت ${q} — فرصت خرید؟`, time: "امروز", impact: "بالا" });
  }
  
  if (analysis.volatility > 5) {
    news.push({ type: "warn", title: `نوسان بالا (${analysis.volatility}٪) در بازار ${q} — معامله‌گران محتاط باشند`, time: "امروز", impact: "متوسط" });
  }
  
  if (analysis.rsi > 70) {
    news.push({ type: "warn", title: `اشباع خرید — RSI ${analysis.rsi} — احتمال اصلاح قیمت`, time: "دیروز", impact: "متوسط" });
  } else if (analysis.rsi < 30) {
    news.push({ type: "up", title: `اشباع فروش — RSI ${analysis.rsi} — سیگنال خرید قوی`, time: "دیروز", impact: "بالا" });
  }
  
  news.push({ type: "info", title: `میانگین ۷ روزه ${q}: ${Math.round(analysis.ma7/1000000)} میلیون — میانگین ۳۰ روزه: ${Math.round(analysis.ma30/1000000)} میلیون`, time: "تحلیل تکنیکال", impact: "کم" });
  news.push({ type: "info", title: `حمایت: ${Math.round(analysis.support/1000000)}M — مقاومت: ${Math.round(analysis.resistance/1000000)}M — پیش‌بینی: ${analysis.forecast}`, time: "تحلیل", impact: "متوسط" });
  
  return news.slice(0,5);
}
