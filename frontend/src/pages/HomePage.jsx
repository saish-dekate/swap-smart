import { Link } from 'react-router-dom';
import { ArrowRight, Shield, RefreshCw, Star } from 'lucide-react';
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
      <section className="relative bg-black text-white py-24">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fadeIn">
              Trade Smart,<br />Swap Smarter
            </h1>
            <p className="text-xl text-gray-300 mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              The intelligent barter marketplace where you trade products instead of selling.
              Find perfect matches with our AI-powered fairness engine.
            </p>
            <div className="flex gap-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <Link to="/products" className="btn bg-white text-black hover:bg-gray-100">
                Browse Products
              </Link>
              <Link to="/register" className="btn border-2 border-white hover:bg-white/10">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust System</h3>
              <p className="text-gray-600">Verified users with transparent trust scores and badges</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fair Swaps</h3>
              <p className="text-gray-600">AI-powered matching ensures fair product exchanges</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Review System</h3>
              <p className="text-gray-600">Build reputation through honest reviews from swap partners</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link to="/products" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
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
            <div className="text-center py-12">
              <p className="text-gray-500">No products available yet. Be the first to list!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
