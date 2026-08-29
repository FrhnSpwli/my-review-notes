import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BookOpen, Film, Tv, Trophy } from 'lucide-react';
import Header from '../components/Header';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const monthNames = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May', '06': 'June', '07': 'July', '08': 'August',
  '09': 'September', '10': 'October', '11': 'November', '12': 'December'
};

export default function Achievement() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewData);
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.log("User logged out, listener permission denied (expected).");
      } else {
        console.error("Firestore snapshot error:", error);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  // Derived state
  const { availableYears, availableMonths, stats, barData } = useMemo(() => {
    const finishedReviews = reviews.filter(r => r.status === 'finished');
    
    const years = new Set();
    const months = new Set(); // Stores MM strings

    const getDateString = (r) => {
      if (r.date) return r.date;
      if (r.createdAt) {
        const dateObj = r.createdAt.toDate();
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return null;
    };

    // Populate available filters based on review dates
    finishedReviews.forEach(r => {
      const dateString = getDateString(r);
      if (dateString) {
        const [year, month] = dateString.split('-');
        if (year) years.add(year);
        if (month) months.add(month);
      }
    });

    const filteredReviews = finishedReviews.filter(r => {
      const dateString = getDateString(r);
      if (!dateString) return false;
      const [year, month] = dateString.split('-');
      
      const yearMatch = selectedYear === 'all' || year === selectedYear;
      const monthMatch = selectedMonth === 'all' || month === selectedMonth;
      
      return yearMatch && monthMatch;
    });

    const booksCompleted = filteredReviews.filter(r => r.type === 'book').length;
    const moviesCompleted = filteredReviews.filter(r => r.type === 'movie').length;
    const seriesCompleted = filteredReviews.filter(r => r.type === 'series').length;
    const moviesSeriesCompleted = moviesCompleted + seriesCompleted;

    const barDataMap = {};
    filteredReviews.forEach(r => {
      const dateString = getDateString(r);
      if (!dateString) return;
      const [year, month] = dateString.split('-');
      
      let key;
      if (selectedYear === 'all') {
        key = year; 
      } else if (selectedMonth === 'all') {
        key = monthNames[month] || month; 
      } else {
        key = `${monthNames[month]} ${year}`;
      }

      if (!barDataMap[key]) {
        barDataMap[key] = { name: key, Books: 0, Movies: 0, Series: 0 };
      }
      
      if (r.type === 'book') barDataMap[key].Books++;
      else if (r.type === 'movie') barDataMap[key].Movies++;
      else if (r.type === 'series') barDataMap[key].Series++;
    });

    let barData = Object.values(barDataMap);
    if (selectedYear === 'all') {
      barData.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedMonth === 'all') {
      const monthOrder = Object.values(monthNames);
      barData.sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));
    }

    return {
      availableYears: Array.from(years).sort().reverse(),
      availableMonths: Array.from(months).sort(),
      stats: {
        books: booksCompleted,
        moviesSeries: moviesSeriesCompleted,
        total: filteredReviews.length
      },
      barData
    };
  }, [reviews, selectedYear, selectedMonth]);

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">My Achievement</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-dark-800 p-1.5 rounded-lg border border-dark-700">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-slate-300 text-sm border-none focus:ring-0 cursor-pointer outline-none pl-2"
              >
                <option value="all" className="bg-dark-900">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year} className="bg-dark-900">{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2 bg-dark-800 p-1.5 rounded-lg border border-dark-700">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-300 text-sm border-none focus:ring-0 cursor-pointer outline-none pl-2"
              >
                <option value="all" className="bg-dark-900">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month} className="bg-dark-900">{monthNames[month] || month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Books Card */}
            <div className="glass-panel rounded-2xl p-8 relative group hover:border-primary-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                  <BookOpen className="w-7 h-7 text-primary-400" />
                </div>
                <span className="text-sm font-medium text-slate-400 bg-dark-800 px-3 py-1 rounded-full">Completed</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-slate-400 text-lg font-medium mb-1">Total Books</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold text-white tracking-tight">{stats.books}</span>
                  <span className="text-slate-500 text-sm">books</span>
                </div>
              </div>
            </div>

            {/* Movies/Series Card */}
            <div className="glass-panel rounded-2xl p-8 relative group hover:border-indigo-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex space-x-2">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Film className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Tv className="w-7 h-7 text-purple-400" />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-400 bg-dark-800 px-3 py-1 rounded-full">Completed</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-slate-400 text-lg font-medium mb-1">Total Movies & Series</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold text-white tracking-tight">{stats.moviesSeries}</span>
                  <span className="text-slate-500 text-sm">titles</span>
                </div>
              </div>
            </div>

        </div>

        {/* Charts Section */}
        {stats.total > 0 && (
          <div className="mt-8">
            <div className="glass-panel rounded-2xl p-6 relative group w-full">
              <h3 className="text-slate-300 text-lg font-medium mb-6">Trends</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={barData}
                    margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={{stroke: '#334155'}} padding={{ left: 30, right: 30 }} />
                    <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                      itemStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#94a3b8' }} />
                    <Line type="monotone" dataKey="Books" stroke="#38bdf8" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Movies" stroke="#818cf8" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Series" stroke="#c084fc" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
