import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsAPI, swapsAPI, bidsAPI, matchingAPI, reviewsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star, MessageCircle, RefreshCw, DollarSign, ArrowLeft, Shield, Calendar, Award } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/600x400';
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

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [matches, setMatches] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [myProducts, setMyProducts] = useState([]);
  const [cashOffer, setCashOffer] = useState('');
  const [message, setMessage] = useState('');
  const [offerType, setOfferType] = useState('swap'); // 'swap', 'cash', 'both'

  useEffect(() => {
    Promise.all([
      productsAPI.get(id),
      productsAPI.matches(id),
    ])
      .then(([productRes, matchesRes]) => {
        setProduct(productRes.data);
        setMatches(matchesRes.data.matches || []);
        if (productRes.data?.owner?.id) {
          return reviewsAPI.list(productRes.data.owner.id);
        }
        return { data: [] };
      })
      .then((reviewsRes) => {
        setReviews(reviewsRes.data || []);
      })
      .catch((err) => {
        console.error('Error loading product:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      productsAPI.myProducts()
        .then((res) => setMyProducts(res.data || []))
        .catch(console.error);
    }
  }, [isAuthenticated]);

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    try {
      if (offerType === 'swap' || offerType === 'both') {
        await swapsAPI.create({
          receiver: product.owner.id,
          sender_product: selectedProduct,
          receiver_product: id,
          cash_adjustment: offerType === 'both' ? cashOffer : 0,
          message,
        });
      } else if (offerType === 'cash') {
        await bidsAPI.create({
          product: id,
          offered_product: null,
          cash_offer: cashOffer,
          message,
        });
      }
      setShowOfferModal(false);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit offer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product || !product.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product not found</p>
          <button onClick={() => navigate('/products')} className="btn btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === product.owner?.id;
  const imageUrl = getImageUrl(product.images?.[0]?.image);
  const owner = product.owner;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images & Videos */}
          <div className="lg:col-span-2">
            {/* Main Media Display */}
            <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden mb-4">
              {product.images?.[0]?.video ? (
                <video 
                  src={product.images[0].video} 
                  controls 
                  className="w-full h-full object-contain"
                />
              ) : (
                <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
              )}
            </div>
            {/* Thumbnail Gallery */}
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1).map((img, idx) => (
                  <div key={idx} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    {img.video ? (
                      <video src={getImageUrl(img.video)} className="w-full h-full object-cover" />
                    ) : (
                      <img src={getImageUrl(img.image)} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Owner */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${conditionColors[product.condition]}`}>
                {product.condition.replace('_', ' ')}
              </span>
              <span className="text-gray-500">{product.category?.name}</span>
              {product.is_available ? (
                <span className="badge bg-green-100 text-green-800">Available</span>
              ) : (
                <span className="badge bg-red-100 text-red-800">Swapped</span>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <p className="text-4xl font-bold mb-4">₹{product.estimated_value}</p>

            {/* Owner Card */}
            {owner && (
              <div className="card p-4 mb-6">
                <h3 className="font-semibold mb-3">Listed by</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {(owner.first_name || owner.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{owner.first_name || owner.email}</p>
                    <p className="text-sm text-gray-500">@{owner.username}</p>
                  </div>
                </div>

                {/* Owner Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-lg">{owner.trust_score}</span>
                    </div>
                    <p className="text-xs text-gray-500">Trust Score</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <RefreshCw className="w-4 h-4" />
                      <span className="font-bold text-lg">{owner.total_swaps}</span>
                    </div>
                    <p className="text-xs text-gray-500">Swaps Done</p>
                  </div>
                </div>

                {/* Badges */}
                {owner.badges && owner.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {owner.badges.map((badge, idx) => (
                      <span key={idx} className="badge bg-black text-white flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {badge.replace('_', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Member Since */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {new Date(owner.created_at).toLocaleDateString()}</span>
                </div>

                {/* Reviews */}
                {reviews.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Recent Reviews</p>
                    {reviews.slice(0, 2).map((review) => (
                      <div key={review.id} className="text-sm mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        {review.comment && <p className="text-gray-600">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {product.location && (
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <MapPin className="w-5 h-5" />
                {product.location}
              </div>
            )}

            <div className="prose mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>

            {!isOwner && isAuthenticated && product.is_available && (
              <button
                onClick={() => setShowOfferModal(true)}
                className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> Make Offer
              </button>
            )}

            {!isOwner && isAuthenticated && !product.is_available && (
              <div className="w-full btn bg-gray-200 text-gray-500 py-3 text-center cursor-not-allowed">
                This item has been swapped
              </div>
            )}
          </div>
        </div>

        {/* Similar Items */}
        {matches.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Similar Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {matches.slice(0, 4).map((match) => (
                <Link
                  key={match.product.id}
                  to={`/products/${match.product.id}`}
                  className="card p-4"
                >
                  <p className="font-medium mb-1 truncate">{match.product.title}</p>
                  <p className="text-gray-500 mb-2">₹{match.product.estimated_value}</p>
                  <p className="text-green-600 font-bold">{match.compatibility_score}% match</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Make an Offer</h3>
            <form onSubmit={handleSubmitOffer}>
              {/* Offer Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Offer Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferType('swap')}
                    className={`p-3 rounded-lg border text-center ${offerType === 'swap' ? 'bg-black text-white' : 'bg-white'}`}
                  >
                    <RefreshCw className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">Swap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('cash')}
                    className={`p-3 rounded-lg border text-center ${offerType === 'cash' ? 'bg-black text-white' : 'bg-white'}`}
                  >
                    <DollarSign className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">Cash Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('both')}
                    className={`p-3 rounded-lg border text-center ${offerType === 'both' ? 'bg-black text-white' : 'bg-white'}`}
                  >
                    <RefreshCw className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">Swap + Cash</span>
                  </button>
                </div>
              </div>

              {/* Product Selection (for swap) */}
              {(offerType === 'swap' || offerType === 'both') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Your Product to Swap</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select a product</option>
                    {myProducts.filter(p => p.is_available).map((p) => (
                      <option key={p.id} value={p.id}>{p.title} - ₹{p.estimated_value}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cash Offer (for cash or both) */}
              {(offerType === 'cash' || offerType === 'both') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {offerType === 'both' ? 'Additional Cash (optional)' : 'Cash Offer (₹)'}
                  </label>
                  <input
                    type="number"
                    value={cashOffer}
                    onChange={(e) => setCashOffer(e.target.value)}
                    className="input"
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Add a message to your offer..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Send Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
