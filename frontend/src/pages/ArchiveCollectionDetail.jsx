import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { archiveService } from '../services/api'
import { Archive, ChevronLeft, ChevronRight, X, Camera, ImageIcon } from 'lucide-react'

// Custom Image component with progressive loading and fallback
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width = 300, 
  height = 200, 
  quality = 85,
  onClick,
  loading = 'lazy',
  showPlaceholder = true
}) => {
  const [imageState, setImageState] = useState('loading') // loading, loaded, error
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0)
  const [timeoutId, setTimeoutId] = useState(null)
  
  const getOptimizedImageUrls = (originalUrl, w, h, q) => {
    if (!originalUrl || !originalUrl.includes('hdl.handle.net')) return [originalUrl]
    
    return [
      // Primary: Try direct URL first (most reliable)
      originalUrl,
      // Fallback: Images.weserv.nl with simple parameters
      `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=${w}&h=${h}&fit=cover&q=${q}`,
      // Fallback: Try with different quality
      `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=${w}&h=${h}&fit=cover&q=80`,
      // Fallback: Try with different fit mode
      `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=${w}&h=${h}&fit=inside&q=${q}`,
      // Fallback: Try with JPG format
      `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=${w}&h=${h}&fit=cover&q=80&f=jpg`
    ]
  }

  const imageUrls = getOptimizedImageUrls(src, width, height, quality)

  // Set up timeout for image loading
  useEffect(() => {
    if (imageState === 'loading') {
      const timeout = setTimeout(() => {
        console.log(`Image loading timeout (attempt ${currentSrcIndex + 1}/${imageUrls.length}):`, imageUrls[currentSrcIndex])
        handleImageError()
      }, 5000) // 5 second timeout
      
      setTimeoutId(timeout)
      
      return () => {
        if (timeout) {
          clearTimeout(timeout)
        }
      }
    }
  }, [currentSrcIndex, imageState])

  const handleImageLoad = () => {
    console.log(`Image loaded successfully (attempt ${currentSrcIndex + 1}/${imageUrls.length}):`, imageUrls[currentSrcIndex])
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setImageState('loaded')
  }

  const handleImageError = () => {
    console.log(`Image failed to load (attempt ${currentSrcIndex + 1}/${imageUrls.length}):`, imageUrls[currentSrcIndex])
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    
    // If direct URL fails, hide the image immediately
    if (currentSrcIndex === 0) {
      console.log('Direct URL failed, hiding image immediately')
      setImageState('error')
      return
    }
    
    if (currentSrcIndex < imageUrls.length - 1) {
      // Try next URL in the fallback chain
      setCurrentSrcIndex(currentSrcIndex + 1)
    } else {
      // All URLs failed
      console.log('All image URLs failed, showing error state')
      setImageState('error')
    }
  }

  const currentSrc = imageUrls[currentSrcIndex]

  // Don't render anything if image failed to load
  if (imageState === 'error') {
    return null
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {imageState === 'loading' && showPlaceholder && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        } ${onClick ? 'cursor-pointer' : ''}`}
        loading={loading}
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          imageRendering: '-webkit-optimize-contrast'
        }}
      />
    </div>
  )
}

const ArchiveCollectionDetail = () => {
  const { id } = useParams()
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showImageBrowser, setShowImageBrowser] = useState(false)

  useEffect(() => {
    fetchCollection()
  }, [id])

  // Preload images for better performance
  useEffect(() => {
    if (collection) {
      const allImages = getAllCollectionImages(collection)
      // Preload first few images
      allImages.slice(0, 6).forEach((obj, index) => {
        const img = new Image()
        img.src = `https://images.weserv.nl/?url=${encodeURIComponent(obj.href)}&w=300&h=300&fit=cover&q=85&f=webp`
      })
    }
  }, [collection])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      console.log('Fetching collection with ID:', id)
      const data = await archiveService.getCollectionById(id)
      console.log('Collection data received:', data)
      if (data && data.id) {
        setCollection(data)
        setError(null)
      } else {
        console.error('Collection not found or invalid data:', data)
        setError('Collection not found')
      }
    } catch (err) {
      setError('Failed to fetch collection')
      console.error('Error fetching collection:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    return dateString
  }

  const getLanguageText = (languages) => {
    if (!languages || !Array.isArray(languages)) return 'Unknown'
    return languages.map(lang => lang.text || lang).join(', ')
  }


  const getCollectionImage = (collection) => {
    // First check if collection has digital objects
    if (collection.digital_objects && collection.digital_objects.length > 0) {
      // Prioritize thumbnail for fastest loading
      const firstImage = collection.digital_objects.find(obj => 
        obj.role === 'image-thumbnail' && obj.href && obj.href.includes('hdl.handle.net')
      ) || collection.digital_objects.find(obj => 
        obj.href && obj.href.includes('hdl.handle.net')
      )
      if (firstImage) {
        return firstImage.href
      }
    }
    
    // If no collection-level images, check if we have files with images
    if (collection.files && collection.files.length > 0) {
      for (const file of collection.files) {
        if (file.digital_objects && file.digital_objects.length > 0) {
          const firstImage = file.digital_objects.find(obj => 
            obj.role === 'image-thumbnail' && obj.href && obj.href.includes('hdl.handle.net')
          ) || file.digital_objects.find(obj => 
            obj.href && obj.href.includes('hdl.handle.net')
          )
          if (firstImage) {
            return firstImage.href
          }
        }
      }
    }
    
    return null
  }

  const getAllCollectionImages = (collection) => {
    const allImages = []
    
    // Add collection-level digital objects
    if (collection.digital_objects && collection.digital_objects.length > 0) {
      collection.digital_objects.forEach(obj => {
        if (obj.href && obj.href.includes('hdl.handle.net')) {
          allImages.push({
            ...obj,
            source: 'collection'
          })
        }
      })
    }
    
    // Add file-level digital objects
    if (collection.files && collection.files.length > 0) {
      collection.files.forEach(file => {
        if (file.digital_objects && file.digital_objects.length > 0) {
          file.digital_objects.forEach(obj => {
            if (obj.href && obj.href.includes('hdl.handle.net')) {
              allImages.push({
                ...obj,
                source: 'file',
                fileTitle: file.title,
                fileId: file.id
              })
            }
          })
        }
      })
    }
    
    console.log('All collection images:', allImages)
    return allImages
  }

  const openImageModal = (index) => {
    setSelectedImageIndex(index)
    setShowImageModal(true)
  }

  const closeImageModal = () => {
    setShowImageModal(false)
    setSelectedImageIndex(null)
  }

  const openImageBrowser = () => {
    setShowImageBrowser(true)
  }

  const closeImageBrowser = () => {
    setShowImageBrowser(false)
  }

  const nextImage = () => {
    const allImages = getAllCollectionImages(collection)
    if (selectedImageIndex < allImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  const renderContainerInfo = (containers) => {
    if (!containers || !Array.isArray(containers)) return null
    
    return (
      <div className="space-y-2">
        {containers.map((container, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              <span className="font-medium">{container.type}:</span> {container.text}
            </span>
            {container.label && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {container.label}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">
              {error || 'Collection not found'}
            </div>
            <Link
              to="/archive/collections"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Collections
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-gray-700">Home</Link></li>
            <li>/</li>
            <li><Link to="/archive/collections" className="hover:text-gray-700">Archive Collections</Link></li>
            <li>/</li>
            <li className="text-gray-900">{collection.title}</li>
          </ol>
        </nav>

        {/* Collection Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="mb-6">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {getCollectionImage(collection) ? (
                  <OptimizedImage
                    src={getCollectionImage(collection)}
                    alt={collection.title}
                    className="w-48 h-36 rounded-lg shadow-md"
                    width={250}
                    height={180}
                    quality={90}
                    loading="eager"
                    showPlaceholder={true}
                  />
                ) : (
                  <div className="w-48 h-36 flex items-center justify-center bg-gradient-to-br from-blue-300 to-blue-400 rounded-lg shadow-md">
                    <Archive className="h-12 w-12 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {collection.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span><span className="font-medium">ID:</span> {collection.unit_id}</span>
                  {collection.date_inclusive && (
                    <span><span className="font-medium">Date:</span> {formatDate(collection.date_inclusive)}</span>
                  )}
                  {collection.finding_aid_status && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {collection.finding_aid_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Collection Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Abstract */}
              {collection.abstract && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                  <p className="text-gray-700 leading-relaxed">{collection.abstract}</p>
                </div>
              )}

              {/* Scope and Content */}
              {collection.scope_content && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Scope and Content</h3>
                  <p className="text-gray-700 leading-relaxed">{collection.scope_content}</p>
                </div>
              )}

              {/* Biographical/Historical */}
              {collection.biographical_historical && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Biographical/Historical</h3>
                  <p className="text-gray-700 leading-relaxed">{collection.biographical_historical}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Physical Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Physical Description</h3>
                <div className="space-y-2">
                  {collection.extent && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Extent:</span> {collection.extent}
                    </p>
                  )}
                  {collection.carrier && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Carrier:</span> {collection.carrier}
                    </p>
                  )}
                </div>
              </div>

              {/* Languages */}
              {collection.languages && collection.languages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Languages</h3>
                  <p className="text-sm text-gray-700">{getLanguageText(collection.languages)}</p>
                </div>
              )}


              {/* Repository */}
              {collection.repository && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Repository</h3>
                  <p className="text-sm text-gray-700">{collection.repository}</p>
                </div>
              )}

              {/* Digital Objects/Images */}
              {(() => {
                const allImages = getAllCollectionImages(collection)
                if (allImages.length > 0) {
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Collection Images ({allImages.length})
                        </h3>
                        <button
                          onClick={() => setShowImageBrowser(true)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Browse All
                        </button>
                      </div>
                      
                      {/* Featured Images Grid - Better space utilization */}
                      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 auto-rows-fr">
                        {allImages.slice(0, 18).map((obj, index) => (
                          <div key={index} className="group cursor-pointer" onClick={() => openImageModal(index)}>
                            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                              <OptimizedImage
                                src={obj.href}
                                alt={obj.title || `Image ${index + 1}`}
                                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                                width={150}
                                height={150}
                                quality={85}
                                loading="lazy"
                                showPlaceholder={true}
                              />
                            </div>
                            {obj.title && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">{obj.title}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {allImages.length > 18 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => setShowImageBrowser(true)}
                            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            View All {allImages.length} Images
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }
                return null
              })()}

              {/* Finding Aid */}
              {collection.file_path && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Finding Aid</h3>
                  <a 
                    href={`file://${collection.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Download Finding Aid (XML)
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Administrative Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Administrative Information</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {collection.creation_date && (
                    <p><span className="font-medium">Created:</span> {collection.creation_date}</p>
                  )}
                  {collection.language_usage && (
                    <p><span className="font-medium">Language Usage:</span> {collection.language_usage}</p>
                  )}
                  <p><span className="font-medium">Last Updated:</span> {new Date(collection.updated_at || collection.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Series Section */}
        {collection.series && collection.series.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Series ({collection.series.length})
            </h2>
            <div className="space-y-4">
              {collection.series.map((series) => (
                <div key={series.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {series.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        {series.unit_id && (
                          <p><span className="font-medium">ID:</span> {series.unit_id}</p>
                        )}
                        {series.date_inclusive && (
                          <p><span className="font-medium">Date:</span> {formatDate(series.date_inclusive)}</p>
                        )}
                        {series.files && series.files.length > 0 && (
                          <p><span className="font-medium">Files:</span> {series.files.length}</p>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/archive/series/${series.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      View Series →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Link
            to="/archive/collections"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Collections
          </Link>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImageIndex !== null && (() => {
        const allImages = getAllCollectionImages(collection)
        const currentImage = allImages[selectedImageIndex]
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="relative max-w-4xl max-h-full p-4">
              {/* Close button */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <X className="h-8 w-8" />
              </button>
              
              {/* Navigation buttons */}
              {selectedImageIndex > 0 && (
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}
              
              {selectedImageIndex < allImages.length - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
              
              {/* Image */}
              <OptimizedImage
                src={currentImage.href}
                alt={currentImage.title || `Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                width={1200}
                height={800}
                quality={95}
                loading="eager"
                showPlaceholder={true}
              />
              
              {/* Image info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {currentImage.title || `Image ${selectedImageIndex + 1}`}
                    </h3>
                    {currentImage.description && (
                      <p className="text-sm text-gray-300 mb-2">{currentImage.description}</p>
                    )}
                    {currentImage.source === 'file' && currentImage.fileTitle && (
                      <p className="text-sm text-blue-300">From: {currentImage.fileTitle}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-300 ml-4">
                    {selectedImageIndex + 1} of {allImages.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Image Browser Modal */}
      {showImageBrowser && (() => {
        const allImages = getAllCollectionImages(collection)
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative w-full h-full p-4">
              {/* Close button */}
              <button
                onClick={closeImageBrowser}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <X className="h-8 w-8" />
              </button>
              
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  All Collection Images ({allImages.length})
                </h2>
                <p className="text-gray-300">Click on any image to view it in detail</p>
              </div>
              
              {/* Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-[80vh] overflow-y-auto auto-rows-fr">
                {allImages.map((obj, index) => (
                  <div 
                    key={index} 
                    className="group cursor-pointer" 
                    onClick={() => {
                      setSelectedImageIndex(index)
                      setShowImageModal(true)
                      setShowImageBrowser(false)
                    }}
                  >
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <OptimizedImage
                        src={obj.href}
                        alt={obj.title || `Image ${index + 1}`}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        width={200}
                        height={200}
                        quality={85}
                        loading="lazy"
                        showPlaceholder={true}
                      />
                    </div>
                    {obj.title && (
                      <p className="text-xs text-white mt-2 line-clamp-2 text-center">{obj.title}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default ArchiveCollectionDetail
