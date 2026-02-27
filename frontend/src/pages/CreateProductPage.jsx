import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../api';
import { ArrowLeft, Upload, X, Video } from 'lucide-react';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good',
    estimated_value: '',
    location: '',
  });

  useEffect(() => {
    productsAPI.categories()
      .then((res) => {
        setCategories(res.data.results || res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setCategories([]);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    const totalMedia = files.length + mediaFiles.length;
    
    if (totalMedia > 5) {
      alert('Maximum 5 media files allowed (images + videos)');
      return;
    }
    
    setMediaFiles([...mediaFiles, ...files]);
    
    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setMediaPreview([...mediaPreview, ...newPreviews]);
  };

  const removeMedia = (index) => {
    const newMedia = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreview.filter((_, i) => i !== index);
    setMediaFiles(newMedia);
    setMediaPreview(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        estimated_value: parseFloat(formData.estimated_value),
      };
      
      if (mediaFiles.length > 0) {
        data.images = mediaFiles;
      }
      
      await productsAPI.create(data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating product:', err);
      console.error('Response:', err.response?.data);
      alert(err.response?.data?.detail || err.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pattern-light">
      <div className="bg-gradient-hero text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
        </div>
        <div className="container-custom relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-4xl font-bold">Add New Product</h1>
          <p className="text-gray-300">List your item for swapping</p>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="max-w-2xl mx-auto">
          <div className="card-glass p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  placeholder="What are you offering?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input"
                  rows={4}
                  placeholder="Describe your item in detail"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Photos & Videos (max 5)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50/50">
                  {mediaPreview.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {mediaPreview.map((item, index) => (
                        <div key={index} className="relative">
                          {item.type === 'video' ? (
                            <video
                              src={item.url}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <img 
                              src={item.url} 
                              alt={`Preview ${index + 1}`} 
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {mediaFiles.length < 5 && (
                    <label className="flex flex-col items-center cursor-pointer">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm text-gray-500">Click to upload photos or videos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleMediaChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">Select category</option>
                    {Array.isArray(categories) && categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Estimated Value (₹)</label>
                  <input
                    type="number"
                    name="estimated_value"
                    value={formData.estimated_value}
                    onChange={handleChange}
                    className="input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 py-4 text-lg shadow-lg shadow-blue-500/25"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
