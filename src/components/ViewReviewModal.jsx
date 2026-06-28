import React from 'react';
import { X, BookOpen, Film, Tv, Star, Clock } from 'lucide-react';

export default function ViewReviewModal({ isOpen, onClose, reviewData }) {
  if (!isOpen || !reviewData) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel w-full max-w-2xl rounded-2xl relative my-8 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50 shrink-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-white">
              Review Details
            </h3>
            {getStatusBadge(reviewData.status)}
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow flex flex-col min-h-0">
          <div className="flex flex-col md:flex-row gap-6 flex-grow min-h-0">
            {/* Image */}
            <div className="w-32 mx-auto md:w-1/3 md:mx-0 shrink-0">
              <div className="aspect-[2/3] bg-dark-800 rounded-xl overflow-hidden relative shadow-lg">
                {reviewData.imageUrl ? (
                  <img
                    src={reviewData.imageUrl}
                    alt={reviewData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    {reviewData.type === 'book' ? <BookOpen className="w-16 h-16 mb-2 opacity-50" /> : reviewData.type === 'series' ? <Tv className="w-16 h-16 mb-2 opacity-50" /> : <Film className="w-16 h-16 mb-2 opacity-50" />}
                    <span className="text-sm">No Cover</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="w-full md:w-2/3 flex flex-col min-h-0">
              <h2 className="text-3xl font-bold text-white mb-2 shrink-0">{reviewData.title}</h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6 shrink-0">
                <span className="uppercase tracking-wider font-semibold text-slate-300 bg-dark-800 px-3 py-1 rounded-lg flex items-center">
                  {reviewData.type === 'book' ? <BookOpen className="w-4 h-4 mr-2 text-primary-400" /> : reviewData.type === 'series' ? <Tv className="w-4 h-4 mr-2 text-purple-400" /> : <Film className="w-4 h-4 mr-2 text-indigo-400" />}
                  {reviewData.type}
                </span>
                <span className="flex items-center bg-dark-800 px-3 py-1 rounded-lg">
                  <Star className="w-4 h-4 mr-2 text-amber-400 fill-amber-400" />
                  <span className="font-medium text-white">{reviewData.rating}/10</span>
                </span>
                <span className="flex items-center bg-dark-800 px-3 py-1 rounded-lg">
                  <Clock className="w-4 h-4 mr-2" /> 
                  {reviewData.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                </span>
              </div>

              <div className="flex-grow flex flex-col min-h-0">
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 shrink-0">Review</h4>
                <div className="bg-dark-800/50 rounded-xl p-5 border border-dark-700/50 flex-grow overflow-y-auto max-h-[180px] min-h-0">
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {reviewData.review || <span className="text-slate-500 italic">No review provided.</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
