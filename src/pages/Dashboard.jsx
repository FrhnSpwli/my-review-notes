import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { LogOut, Plus, BookOpen, Film, Tv, Star, Clock, Edit2, Trash2, AlertTriangle, LayoutGrid, List, ArrowUp, ArrowDown } from 'lucide-react';
import AddReviewModal from '../components/AddReviewModal';
import ViewReviewModal from '../components/ViewReviewModal';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  async function handleDeleteReview() {
    if (!reviewToDelete || !currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'reviews', reviewToDelete.id));
      setShowDeleteConfirm(false);
      setReviewToDelete(null);
    } catch (error) {
      console.error("Error deleting review: ", error);
    }
  }

  const filteredReviews = reviews.filter(r => filterType === 'all' || r.type === filterType);

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      const dateA = a.createdAt?.toMillis() || 0;
      const dateB = b.createdAt?.toMillis() || 0;
      comparison = dateA - dateB;
    } else if (sortBy === 'name') {
      comparison = (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'rating') {
      comparison = (a.rating || 0) - (b.rating || 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const currentlyReading = sortedReviews.filter(r => r.type === 'book' && r.status === 'reading');
  const currentlyWatching = sortedReviews.filter(r => (r.type === 'movie' || r.type === 'series') && r.status === 'watching');
  const planTo = sortedReviews.filter(r => r.status === 'plan_to_watch' || r.status === 'plan_to_read');
  const completed = sortedReviews.filter(r => r.status === 'finished');

  const getStatusBadge = (status) => {
    switch (status) {
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
    <div 
      className="glass-panel rounded-xl overflow-hidden group hover:border-primary-500/50 transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={() => { setViewingReview(item); setIsViewModalOpen(true); }}
    >
      <div className="h-48 relative overflow-hidden bg-dark-800 shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            {item.type === 'book' ? <BookOpen className="w-12 h-12 mb-2 opacity-50" /> : item.type === 'series' ? <Tv className="w-12 h-12 mb-2 opacity-50" /> : <Film className="w-12 h-12 mb-2 opacity-50" />}
            <span className="text-sm">No Cover</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          {getStatusBadge(item.status)}
          <button
            onClick={(e) => { e.stopPropagation(); setEditingReview(item); setIsModalOpen(true); }}
            className="p-1.5 rounded-full bg-dark-900/60 text-slate-300 hover:text-white hover:bg-primary-500 transition-colors backdrop-blur-sm z-10 relative"
            title="Edit Review"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setReviewToDelete(item); setShowDeleteConfirm(true); }}
            className="p-1.5 rounded-full bg-dark-900/60 text-slate-300 hover:text-white hover:bg-red-500 transition-colors backdrop-blur-sm z-10 relative"
            title="Delete Review"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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
      <div className="p-4 flex-grow flex flex-col justify-between">
        <p className="text-slate-400 text-sm line-clamp-3 mb-3">"{item.review}"</p>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-auto">
          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {item.createdAt?.toDate().toLocaleDateString() || 'Just now'}</span>
          <span className="uppercase tracking-wider font-semibold">{item.type}</span>
        </div>
      </div>
    </div>
  );

  const ReviewListItem = ({ item }) => (
    <div 
      className="glass-panel rounded-lg p-4 group hover:border-primary-500/50 transition-all duration-300 flex items-center justify-between cursor-pointer"
      onClick={() => { setViewingReview(item); setIsViewModalOpen(true); }}
    >
      <div className="flex items-center space-x-4 overflow-hidden">
        <div className="w-10 h-10 rounded bg-dark-800 flex items-center justify-center shrink-0">
          {item.type === 'book' ? <BookOpen className="w-5 h-5 text-slate-500" /> : item.type === 'series' ? <Tv className="w-5 h-5 text-slate-500" /> : <Film className="w-5 h-5 text-slate-500" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-base font-bold text-white truncate">{item.title}</h4>
            <div className="hidden sm:block">{getStatusBadge(item.status)}</div>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="uppercase tracking-wider font-semibold text-slate-500">{item.type}</span>
            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {item.createdAt?.toDate().toLocaleDateString() || 'Just now'}</span>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="font-medium text-white">{item.rating}/10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 shrink-0 ml-4">
        <div className="hidden md:block max-w-xs text-xs text-slate-400 truncate">
          {item.review}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingReview(item); setIsModalOpen(true); }}
            className="p-2 rounded-lg bg-dark-800 text-slate-300 hover:text-white hover:bg-primary-500 transition-colors z-10 relative"
            title="Edit Review"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setReviewToDelete(item); setShowDeleteConfirm(true); }}
            className="p-2 rounded-lg bg-dark-800 text-slate-300 hover:text-white hover:bg-red-500 transition-colors z-10 relative"
            title="Delete Review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
              <span className="text-xl font-bold text-white tracking-tight">Rate<span className="text-primary-400">&Notes</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400 hidden sm:block">{currentUser?.email}</span>
              <button
                onClick={() => setShowLogoutConfirm(true)}
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
          <h1 className="text-3xl font-bold text-white">My Collection</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-dark-800 p-1 rounded-lg">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-slate-300 text-sm border-none focus:ring-0 cursor-pointer outline-none pl-2"
              >
                <option value="all" className="bg-dark-900">All Types</option>
                <option value="movie" className="bg-dark-900">Movie</option>
                <option value="series" className="bg-dark-900">Series</option>
                <option value="book" className="bg-dark-900">Book</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 bg-dark-800 p-1 rounded-lg">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-300 text-sm border-none focus:ring-0 cursor-pointer outline-none pl-2"
              >
                <option value="date" className="bg-dark-900">Date</option>
                <option value="name" className="bg-dark-900">Name</option>
                <option value="rating" className="bg-dark-900">Rating</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-md hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center bg-dark-800 p-1 rounded-lg hidden sm:flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => { setEditingReview(null); setIsModalOpen(true); }}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Review</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-12">

            {/* Plan To */}
            {planTo.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-6 border-b border-dark-800 pb-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-semibold text-white">Plan to Watch/Read</h2>
                </div>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "flex flex-col space-y-4"}>
                  {planTo.map(item => (
                    viewMode === 'grid' ? <ReviewCard key={item.id} item={item} /> : <ReviewListItem key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Currently Reading */}
            {currentlyReading.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-6 border-b border-dark-800 pb-2">
                  <BookOpen className="w-5 h-5 text-primary-400" />
                  <h2 className="text-xl font-semibold text-white">Currently Reading</h2>
                </div>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "flex flex-col space-y-4"}>
                  {currentlyReading.map(book => (
                    viewMode === 'grid' ? <ReviewCard key={book.id} item={book} /> : <ReviewListItem key={book.id} item={book} />
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
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "flex flex-col space-y-4"}>
                  {currentlyWatching.map(movie => (
                    viewMode === 'grid' ? <ReviewCard key={movie.id} item={movie} /> : <ReviewListItem key={movie.id} item={movie} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-6 border-b border-dark-800 pb-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-semibold text-white">Completed</h2>
                </div>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "flex flex-col space-y-4"}>
                  {completed.map(completed => (
                    viewMode === 'grid' ? <ReviewCard key={completed.id} item={completed} /> : <ReviewListItem key={completed.id} item={completed} />
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
                  <p className="text-slate-400 mb-6">Start your collection by adding your first book, movie, or series.</p>
                  <button
                    onClick={() => { setEditingReview(null); setIsModalOpen(true); }}
                    className="btn-secondary"
                  >
                    Add Your First Review
                  </button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "flex flex-col space-y-4"}>
                  {sortedReviews.map(item => (
                    viewMode === 'grid' ? <ReviewCard key={item.id} item={item} /> : <ReviewListItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </main>

      <AddReviewModal
        isOpen={isModalOpen}
        initialData={editingReview}
        onClose={() => { setIsModalOpen(false); setEditingReview(null); }}
      />

      <ViewReviewModal
        isOpen={isViewModalOpen}
        reviewData={viewingReview}
        onClose={() => { setIsViewModalOpen(false); setViewingReview(null); }}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Log Out?</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to log out? You will need to sign in again to access your reviews.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-red-500/50 focus:outline-none active:scale-95"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Delete Review?</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete this review? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setReviewToDelete(null); }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-red-500/50 focus:outline-none active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
