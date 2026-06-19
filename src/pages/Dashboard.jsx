import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { LogOut, Plus, BookOpen, Film, Star, Clock } from 'lucide-react';
import AddReviewModal from '../components/AddReviewModal';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      // Ignore permission-denied errors that happen momentarily during logout
      if (error.code === 'permission-denied') {
        console.log("User logged out, listener permission denied (expected).");
      } else {
        console.error("Firestore snapshot error:", error);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  const currentlyReading = reviews.filter(r => r.type === 'book' && r.status === 'reading');
  const currentlyWatching = reviews.filter(r => r.type === 'movie' && r.status === 'watching');

  const getStatusBadge = (status) => {
    switch(status) {
      case 'reading': return <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30">Reading</span>;
      case 'watching': return <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-1 rounded-full border border-indigo-500/30">Watching</span>;
      case 'finished': return <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">Finished</span>;
      case 'plan_to_read': 
      case 'plan_to_watch': 
        return <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full border border-amber-500/30">Plan to {status.includes('read') ? 'Read' : 'Watch'}</span>;
      default: return null;
    }
  };

  const ReviewCard = ({ item }) => (
    <div className="glass-panel rounded-xl overflow-hidden group hover:border-primary-500/50 transition-all duration-300">
      <div className="h-48 relative overflow-hidden bg-dark-800">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            {item.type === 'book' ? <BookOpen className="w-12 h-12 mb-2 opacity-50" /> : <Film className="w-12 h-12 mb-2 opacity-50" />}
            <span className="text-sm">No Cover</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getStatusBadge(item.status)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-900 to-transparent p-4 pt-12">
          <div className="flex justify-between items-end">
            <h4 className="text-lg font-bold text-white leading-tight truncate pr-2">{item.title}</h4>
            <div className="flex items-center space-x-1 bg-dark-900/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-white">{item.rating}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-slate-400 text-sm line-clamp-3 mb-3">"{item.review}"</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {item.createdAt?.toDate().toLocaleDateString() || 'Just now'}</span>
          <span className="uppercase tracking-wider font-semibold">{item.type}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MyReview<span className="text-primary-400">Notes</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400 hidden sm:block">{currentUser?.email}</span>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-dark-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-white">Your Collection</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Review</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Currently Reading */}
            {currentlyReading.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-6 border-b border-dark-800 pb-2">
                  <BookOpen className="w-5 h-5 text-primary-400" />
                  <h2 className="text-xl font-semibold text-white">Currently Reading</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {currentlyReading.map(book => (
                    <ReviewCard key={book.id} item={book} />
                  ))}
                </div>
              </section>
            )}

            {/* Currently Watching */}
            {currentlyWatching.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-6 border-b border-dark-800 pb-2">
                  <Film className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-semibold text-white">Currently Watching</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {currentlyWatching.map(movie => (
                    <ReviewCard key={movie.id} item={movie} />
                  ))}
                </div>
              </section>
            )}

            {/* All Reviews */}
            <section>
              <div className="flex items-center space-x-2 mb-6 border-b border-dark-800 pb-2">
                <Star className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">All Reviews</h2>
              </div>
              
              {reviews.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-2xl">
                  <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No reviews yet</h3>
                  <p className="text-slate-400 mb-6">Start your collection by adding your first book or movie.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="btn-secondary"
                  >
                    Add Your First Review
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {reviews.map(item => (
                    <ReviewCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </main>

      <AddReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
