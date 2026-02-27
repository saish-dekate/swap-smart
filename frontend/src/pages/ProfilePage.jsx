import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { ArrowLeft, Upload, Camera, Award, Star, Shield, Zap, Medal } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath;
};

const badgeConfig = {
  verified: { icon: Shield, color: 'bg-blue-500', label: 'Verified' },
  trusted: { icon: Star, color: 'bg-green-500', label: 'Trusted' },
  top_trader: { icon: Award, color: 'bg-purple-500', label: 'Top Trader' },
  quick_swapper: { icon: Zap, color: 'bg-yellow-500', label: 'Quick Swapper' },
  reviewer: { icon: Medal, color: 'bg-orange-500', label: 'Reviewer' },
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [badges, setBadges] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });

  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(getImageUrl(user.avatar));
    }
    if (user?.badges) {
      setBadges(user.badges);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }
      
      await authAPI.updateProfile(data);
      const userRes = await authAPI.me();
      updateUser(userRes.data);
      window.location.href = '/dashboard';
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevel = (score) => {
    if (score >= 8) return { level: 'Excellent', color: 'text-green-600' };
    if (score >= 6) return { level: 'Good', color: 'text-blue-600' };
    if (score >= 4) return { level: 'Average', color: 'text-yellow-600' };
    return { level: 'New', color: 'text-gray-600' };
  };

  const trustLevel = getTrustLevel(parseFloat(user?.trust_score || 0));

  return (
    <div className="min-h-screen bg-pattern-light">
      <div className="bg-gradient-hero text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl"></div>
        </div>
        <div className="container-custom relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-4xl font-bold">My Profile</h1>
        </div>
      </div>

      <div className="container-custom py-10 -mt-8">
        <div className="max-w-3xl mx-auto">
          <div className="card-glass p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                    <span className="text-5xl font-bold text-white">{user?.email?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              
              <div className="flex items-center justify-center gap-2 mt-3">
                <h2 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h2>
                {user?.is_verified && (
                  <Shield className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-gray-500">{user?.email}</p>
              
              {user?.bio && (
                <p className="text-gray-600 mt-2 max-w-md mx-auto">{user?.bio}</p>
              )}
              
              {user?.location && (
                <p className="text-gray-500 text-sm mt-1">{user?.location}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{user?.trust_score}</div>
                <div className={`text-sm font-medium ${trustLevel.color}`}>{trustLevel.level}</div>
                <div className="text-xs text-gray-500">Trust Score</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{user?.total_swaps}</div>
                <div className="text-sm font-medium text-green-700">Swaps</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">{badges.length}</div>
                <div className="text-sm font-medium text-purple-700">Badges</div>
                <div className="text-xs text-gray-500">Earned</div>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" /> Your Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  {badges.map((badge, idx) => {
                    const config = badgeConfig[badge.badge_type] || badgeConfig.trusted;
                    const Icon = config.icon;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 px-4 py-2 ${config.color} text-white rounded-full shadow-md`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="input"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input"
                  placeholder="City, State"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 py-3 text-lg shadow-lg shadow-blue-500/25"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
