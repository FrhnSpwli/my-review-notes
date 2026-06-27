import React, { useState, useEffect } from 'react';
import { X, BookOpen, Film, Tv, Star } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export default function AddReviewModal({ isOpen, onClose, initialData }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const defaultFormData = {
    title: '',
    type: 'book',
    review: '',
    rating: 5,
    status: 'finished',
    imageUrl: ''
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && formData.type === 'book') {
      setShowResults(true);
    }
  };

  useEffect(() => {
    if (formData.type !== 'book' || formData.title.trim().length < 3 || !showResults) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(formData.title)}&limit=5`);
        const data = await res.json();
        setSearchResults(data.docs || []);
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.title, formData.type, showResults]);

  const handleSelectBook = (book) => {
    setFormData(prev => ({
      ...prev,
      title: book.title,
      imageUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : prev.imageUrl
    }));
    setShowResults(false);
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({ 
      ...prev, 
      type,
      status: type === 'book' ? 'reading' : 'watching'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setLoading(true);
    try {
      if (initialData && initialData.id) {
        const reviewRef = doc(db, 'users', currentUser.uid, 'reviews', initialData.id);
        const { id, createdAt, ...updateData } = formData;
        await updateDoc(reviewRef, {
          ...updateData,
          rating: parseFloat(formData.rating)
        });
      } else {
        const userReviewsRef = collection(db, 'users', currentUser.uid, 'reviews');
        await addDoc(userReviewsRef, {
          ...formData,
          rating: parseFloat(formData.rating),
          createdAt: serverTimestamp()
        });
      }
      
      onClose();
    } catch (error) {
      console.error("Error adding review: ", error);
      alert("Failed to add review. Check console for details.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl relative my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
          <h3 className="text-xl font-semibold text-white">
            {initialData ? 'Edit Review' : 'Add New Review'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Type Selector */}
          <div className="flex space-x-4 mb-2">
            <button
              type="button"
              onClick={() => handleTypeChange('book')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border transition-all ${
                formData.type === 'book' 
                  ? 'bg-primary-600/20 border-primary-500 text-primary-400' 
                  : 'bg-dark-800 border-dark-700 text-slate-400 hover:border-dark-600'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Book</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('movie')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border transition-all ${
                formData.type === 'movie' 
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                  : 'bg-dark-800 border-dark-700 text-slate-400 hover:border-dark-600'
              }`}
            >
              <Film className="w-5 h-5" />
              <span className="font-medium">Movie</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('series')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border transition-all ${
                formData.type === 'series' 
                  ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                  : 'bg-dark-800 border-dark-700 text-slate-400 hover:border-dark-600'
              }`}
            >
              <Tv className="w-5 h-5" />
              <span className="font-medium">Series</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="relative">
                <label className="label-text">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  onFocus={() => {
                    if (formData.type === 'book' && formData.title.trim().length >= 3) {
                      setShowResults(true);
                    }
                  }}
                  onBlur={() => {
                    // Small delay to allow click on result
                    setTimeout(() => setShowResults(false), 200);
                  }}
                  className="input-field"
                  placeholder={`Enter ${formData.type} title`}
                  autoComplete="off"
                />
                
                {formData.type === 'book' && showResults && formData.title.trim().length >= 3 && (
                  <div className="absolute z-10 w-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-slate-400 text-center">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((book, idx) => (
                        <div 
                          key={book.key || idx} 
                          onClick={() => handleSelectBook(book)}
                          className="p-3 hover:bg-dark-700 cursor-pointer flex flex-col border-b border-dark-700/50 last:border-0"
                        >
                          <span className="font-medium text-white truncate">{book.title}</span>
                          {book.author_name && (
                            <span className="text-xs text-slate-400 truncate">by {book.author_name.join(', ')}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-slate-400 text-center">No results found (you can still add manually)</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="label-text">Image URL (Cover/Poster)</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-field appearance-none"
                  >
                    {formData.type === 'book' ? (
                      <>
                        <option value="reading">Reading</option>
                        <option value="plan_to_read">Plan to Read</option>
                      </>
                    ) : (
                      <>
                        <option value="watching">Watching</option>
                        <option value="plan_to_watch">Plan to Watch</option>
                      </>
                    )}
                    <option value="finished">Finished</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Rating (1-10)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="rating"
                      min="1"
                      max="10"
                      step="0.01"
                      required={formData.status === 'finished'}
                      value={formData.rating}
                      onChange={handleChange}
                      className="input-field pl-10"
                    />
                    <Star className="w-5 h-5 text-amber-500 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-full flex flex-col">
              <label className="label-text">Your Review</label>
              <textarea
                name="review"
                required={formData.status === 'finished'}
                value={formData.review}
                onChange={handleChange}
                className="input-field flex-1 resize-none min-h-[150px]"
                placeholder="What did you think about it?"
              ></textarea>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-700/50 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : (initialData ? 'Update Review' : 'Save Review')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
