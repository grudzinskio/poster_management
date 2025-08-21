import React, { useState, useEffect } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorAlert from './ui/ErrorAlert';

function ImageWithAuth({ src, token, alt, className, onClick }) {
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
          console.log('Created blob URL:', objectUrl);
        } else {
          console.error('Failed to fetch image:', response.status, response.statusText);
          setError(true);
        }
      } catch (err) {
        setError(true);
        console.error('Error loading image:', err);
      } finally {
        setLoading(false);
      }
    };

    if (src && token) {
      loadImage();
    }

    // Cleanup function - this runs when component unmounts or dependencies change
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, token]); // Removed imageSrc from dependencies to prevent infinite loop

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 9-3 3L9 9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />
        </svg>
      </div>
    );
  }

  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      onClick={onClick}
      onLoad={(e) => {
        console.log('Image loaded successfully', e.target.naturalWidth, 'x', e.target.naturalHeight);
      }}
      onError={(e) => {
        console.log('Image failed to load:', e.target.src);
      }}
    />
  );
}

function CampaignImages({ campaignId, token }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/campaigns/${campaignId}/images`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const imageFilenames = await response.json();
          setImages(imageFilenames);
          setError('');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load images');
        }
      } catch (err) {
        setError('Network error loading images');
        console.error('Error fetching campaign images:', err);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId && token) {
      fetchImages();
    }
  }, [campaignId, token]);

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading images..." />;
  }

  if (error) {
    return <ErrorAlert error={error} />;
  }

  if (images.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic p-4">
        No images uploaded for this campaign yet.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-lg font-semibold mb-3 text-gray-700">Campaign Images</h4>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.map((image, index) => (
          <div 
            key={index} 
            className="border-2 border-blue-300 rounded-lg p-2 cursor-pointer"
            onClick={() => openImageModal(image)}
          >
            <ImageWithAuth 
              src={`/api/campaigns/images/${image}`} 
              token={token}
              alt={`Campaign image ${index + 1}`}
              className="max-w-full max-h-32 object-contain"
            />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl font-bold"
              aria-label="Close modal"
            >
              ✕
            </button>
            <ImageWithAuth 
              src={`/api/campaigns/images/${selectedImage}`} 
              token={token}
              alt="Full size campaign image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignImages;