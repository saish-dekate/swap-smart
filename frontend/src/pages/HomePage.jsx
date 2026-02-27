import { Link } from 'react-router-dom';
import { ArrowRight, Shield, RefreshCw, Star, Sparkles, ArrowDown, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { productsAPI } from '../api';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsAPI.list({ available: true })
      .then((res) => setProducts(res.data.results?.slice(0, 8) || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-hero text-white py-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-600/5 to-transparent rounded-full"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 backdrop-blur-sm animate-fadeIn">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-200">Smart Barter Marketplace</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fadeIn hero-gradient-text">
              Trade Smart,<br />Swap Smarter
            </h1>
            <p className="text-xl text-gray-300 mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              The intelligent barter marketplace where you trade products instead of selling.
              Find perfect matches with our AI-powered fairness engine.
            </p>
            <div className="flex flex-wrap gap-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <Link to="/products" className="btn bg-white text-black hover:bg-gray-100 px-6 py-3 text-lg">
                Browse Products
              </Link>
              <Link to="/register" className="btn border-2 border-white/30 hover:bg-white/10 px-6 py-3 text-lg backdrop-blur-sm">
                Get Started
              </Link>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowDown className="w-6 h-6 text-white/50" />
          </div>
        </div>
      </section>

      <section className="py-20 bg-pattern-light">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-glass p-8 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust System</h3>
              <p className="text-gray-600">Verified users with transparent trust scores and badges</p>
            </div>
            <div className="card-glass p-8 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fair Swaps</h3>
              <p className="text-gray-600">AI-powered matching ensures fair product exchanges</p>
            </div>
            <div className="card-glass p-8 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Review System</h3>
              <p className="text-gray-600">Build reputation through honest reviews from swap partners</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Featured Products</h2>
              <p className="text-gray-500">Discover items ready for swapping</p>
            </div>
            <Link to="/products" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 card-glass">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-4">No products available yet. Be the first to list!</p>
              <Link to="/products/create" className="btn btn-primary">
                Add Your First Product
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-pattern text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Swapping?</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already trading smarter with SwapSmart
          </p>
          <Link to="/register" className="btn bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg inline-flex items-center gap-2">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
