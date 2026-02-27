import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/300x200?text=No+Image';
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath;
};

const conditionColors = {
  new: 'bg-green-100 text-green-800',
  like_new: 'bg-blue-100 text-blue-800',
  good: 'bg-yellow-100 text-yellow-800',
  fair: 'bg-orange-100 text-orange-800',
  poor: 'bg-red-100 text-red-800',
};

export default function ProductCard({ product }) {
  const imageUrl = getImageUrl(product.primary_image);
  const isSwapped = !product.is_available;
  
  return (
    <Link 
      to={`/products/${product.id}`} 
      className={`card group ${isSwapped ? 'opacity-75' : ''} hover:shadow-xl hover:shadow-black/5 transition-all duration-300 hover:-translate-y-2`}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
            View Details <ArrowRight className="w-4 h-4" />
          </span>
        </div>
        <span className={`absolute top-3 right-3 badge ${conditionColors[product.condition] || 'bg-gray-100'}`}>
          {product.condition.replace('_', ' ')}
        </span>
        {isSwapped && (
          <span className="absolute top-3 left-3 badge bg-red-500 text-white">
            Swapped
          </span>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">{product.title}</h3>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ₹{product.estimated_value}
          </span>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {product.category?.name || 'Uncategorized'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
          {product.location && (
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{product.location}</span>
            </div>
          )}
          
          {product.owner && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{product.owner.trust_score}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
