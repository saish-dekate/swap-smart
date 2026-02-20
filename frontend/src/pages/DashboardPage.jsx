import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI, swapsAPI, bidsAPI, matchingAPI } from '../api';
import { Package, RefreshCw, DollarSign, Bell, Sparkles, Trash2, ToggleLeft, ToggleRight, MapPin, Star, MessageCircle } from 'lucide-react';

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

function MyProductCard({ product, onDelete, onToggleStatus, refreshProducts }) {
  const imageUrl = getImageUrl(product.primary_image);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await onDelete(product.id);
      refreshProducts();
    }
  };

  const handleToggleStatus = async () => {
    await onToggleStatus(product.id, !product.is_available);
    refreshProducts();
  };

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-square bg-gray-100">
        <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
        <span className={`absolute top-2 right-2 badge ${conditionColors[product.condition] || 'bg-gray-100'}`}>
          {product.condition.replace('_', ' ')}
        </span>
        <span className={`absolute top-2 left-2 badge ${product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {product.is_available ? 'Available' : 'Swapped'}
        </span>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{product.title}</h3>
        <p className="text-xl font-bold mb-2">₹{product.estimated_value}</p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4" />
          <span>{product.location || 'No location'}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleToggleStatus}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              product.is_available 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {product.is_available ? (
              <><ToggleRight className="w-4 h-4" /> Mark as Swapped</>
            ) : (
              <><ToggleLeft className="w-4 h-4" /> Mark as Available</>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [bids, setBids] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadData = () => {
    Promise.all([
      productsAPI.myProducts(),
      swapsAPI.list(),
      bidsAPI.list(),
      matchingAPI.suggested(),
    ])
      .then(([productsRes, swapsRes, bidsRes, matchesRes]) => {
        setProducts(productsRes.data || []);
        setSwaps(swapsRes.data?.results || []);
        setBids(bidsRes.data?.results || []);
        setMatches(matchesRes.data?.matches || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProduct = async (id) => {
    await productsAPI.delete(id);
  };

  const handleToggleStatus = async (id, isAvailable) => {
    await productsAPI.update(id, { is_available: isAvailable });
  };

  const handleAcceptSwap = async (swapId) => {
    try {
      const res = await swapsAPI.accept(swapId);
      loadData();
      setSuccessMessage({
        id: Date.now(),
        message: 'Swap accepted! You can now message each other.',
        conversationId: res.data?.conversation_id
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error accepting swap:', error);
    }
  };

  const tabs = [
    { id: 'products', label: 'My Products', icon: Package },
    { id: 'swaps', label: 'Swaps', icon: RefreshCw },
    { id: 'bids', label: 'Bids', icon: DollarSign },
    { id: 'matches', label: 'Smart Matches', icon: Sparkles },
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    completed: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-black text-white py-12">
        <div className="container-custom">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold">{user?.email?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user?.first_name} {user?.last_name}</h1>
              <p className="text-gray-300">{user?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <Bell className="w-4 h-4" /> Trust: {user?.trust_score}/10
                </span>
                <span>{user?.total_swaps} swaps completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span>{successMessage.message}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/messages')}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
              >
                Go to Messages
              </button>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">My Products</h2>
                  <Link to="/products/create" className="btn btn-primary">
                    Add Product
                  </Link>
                </div>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <MyProductCard 
                        key={product.id} 
                        product={product} 
                        onDelete={handleDeleteProduct}
                        onToggleStatus={handleToggleStatus}
                        refreshProducts={loadData}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No products yet</p>
                    <Link to="/products/create" className="text-black font-medium hover:underline">
                      Add your first product
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'swaps' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Swap Requests</h2>
                {swaps.length > 0 ? (
                  <div className="space-y-4">
                    {swaps.map((swap) => (
                      <div key={swap.id} className="card p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {swap.sender.email === user?.email
                                ? `To: ${swap.receiver.email}`
                                : `From: ${swap.sender.email}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {swap.sender_product?.title} ↔ {swap.receiver_product?.title}
                            </p>
                            {swap.cash_adjustment > 0 && (
                              <p className="text-sm">Cash: ₹{swap.cash_adjustment}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${statusColors[swap.status]}`}>
                              {swap.status}
                            </span>
                            {swap.status === 'pending' && swap.receiver.id === user?.id && (
                              <button
                                onClick={() => handleAcceptSwap(swap.id)}
                                className="btn btn-primary text-sm"
                              >
                                Accept
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <RefreshCw className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No swap requests</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bids' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">My Bids</h2>
                {bids.length > 0 ? (
                  <div className="space-y-4">
                    {bids.map((bid) => (
                      <div key={bid.id} className="card p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{bid.product?.title}</p>
                            {bid.offered_product && (
                              <p className="text-sm text-gray-500">
                                Offering: {bid.offered_product.title}
                              </p>
                            )}
                            {bid.cash_offer && (
                              <p className="text-sm">Cash: ₹{bid.cash_offer}</p>
                            )}
                          </div>
                          <span className={`badge ${statusColors[bid.status]}`}>
                            {bid.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No bids yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matches' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Smart Matches</h2>
                {matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.map((match, idx) => (
                      <div key={idx} className="card p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-500">
                              Your: {match.your_product?.title}
                            </p>
                            <p className="font-medium">
                              Match: {match.matched_product?.title}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {match.compatibility_score}%
                            </p>
                            <p className="text-sm text-gray-500">match</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Add products to see smart matches</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
