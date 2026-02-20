import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';

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
    <Link to={`/products/${product.id}`} className={`card group ${isSwapped ? 'opacity-75' : ''}`}>
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className={`absolute top-3 right-3 badge ${conditionColors[product.condition] || 'bg-gray-100'}`}>
          {product.condition.replace('_', ' ')}
        </span>
        {isSwapped && (
          <span className="absolute top-3 left-3 badge bg-red-500 text-white">
            Swapped
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{product.title}</h3>
        
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">₹{product.estimated_value}</span>
          <span className="text-sm text-gray-500">
            {product.category?.name || 'Uncategorized'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
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
