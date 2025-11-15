import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { archiveService } from '../services/api'
import { Archive, ChevronLeft, ChevronRight, X, Camera, ImageIcon } from 'lucide-react'
import { COLLECTION_IMAGE_MAP } from '../constants/collectionImages'

const isHandleUrl = (url) => typeof url === 'string' && url.includes('hdl.handle.net')

const looksLikeImageUrl = (url) => {
  if (typeof url !== 'string') return false
  const normalized = url.toLowerCase()
  return (
    /\.(jpg|jpeg|png|webp|tif|tiff)(\?.*)?$/.test(normalized) ||
    normalized.includes('/viewer/api/image/') ||
    normalized.includes('/iiif/')
  )
}

const IIIF_IMAGE_BASE = 'https://sites.dlib.nyu.edu/viewer/api/image'

const normalizeIdentifier = (identifier) => {
  if (!identifier || typeof identifier !== 'string') return null
  const withoutQuery = identifier.split('#')[0].split('?')[0].trim()
  if (!withoutQuery) return null
  return withoutQuery.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/{2,}/g, '/')
}

const appendPageSegment = (identifier, page = 1) => {
  if (!identifier) return null
  const sanitized = identifier.replace(/\/+$/, '')
  if (/\/\d+$/.test(sanitized)) {
    return sanitized
  }
  const pageNumber = Number.isInteger(page) && page > 0 ? page : 1
  return `${sanitized}/${pageNumber}`
}

const buildIiifFullFromIdentifier = (identifier, page = 1) => {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized) return null
  const withPage = appendPageSegment(normalized, page)
  return `${IIIF_IMAGE_BASE}/${withPage}/full/full/0/default.jpg`
}

const buildIiifThumbFromIdentifier = (identifier, page = 1) => {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized) return null
  const withPage = appendPageSegment(normalized, page)
  return `${IIIF_IMAGE_BASE}/${withPage}/full/!300,300/0/default.jpg`
}

const buildIiifPreviewFromIdentifier = (identifier, maxSize = 800, page = 1) => {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized) return null
  const withPage = appendPageSegment(normalized, page)
  return `${IIIF_IMAGE_BASE}/${withPage}/full/!${maxSize},${maxSize}/0/default.jpg`
}

const ensureBackPage = (url) => {
  if (typeof url !== 'string') return url
  return url.replace(/(\/api\/image\/[^/]+\/[^/]+\/)1(?=\/)/, '$12')
}

const getFallbackImage = (unitId) =>
  (unitId && COLLECTION_IMAGE_MAP[unitId]) || COLLECTION_IMAGE_MAP.fallback || null

const resolveDigitalObjectImage = (obj, preferThumbnail = false) => {
  if (!obj || typeof obj !== 'object') return null
  
  const candidates = preferThumbnail
    ? [obj.resolved_thumbnail, obj.resolved_full_image, obj.thumbnail, obj.full_image, obj.href]
    : [obj.resolved_full_image, obj.resolved_thumbnail, obj.full_image, obj.thumbnail, obj.href]
  
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && !isHandleUrl(candidate)) {
      return candidate
    }
  }
  
  return candidates.find((candidate) => typeof candidate === 'string' && candidate) || null
}

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
  showPlaceholder = true,
  sizes = '100vw'
}) => {
  const [imageState, setImageState] = useState('loading') // loading, loaded, error
  const [resolvedSrc, setResolvedSrc] = useState(null)
  const [isResolving, setIsResolving] = useState(true)
  
  // Resolve the image URL using fetch to follow redirects
  useEffect(() => {
    let isMounted = true
    
    const resolveImageUrl = async () => {
      if (!src) {
        if (isMounted) {
          setImageState('error')
          setIsResolving(false)
        }
        return
      }
      
      try {
        // Check if this is already a thumbnail URL (fast loading)
        if (typeof src === 'string' && (src.includes('/mode/thumb') || src.includes('?urlappend=/mode/thumb'))) {
          // Use direct thumbnail URL for fast loading
          setResolvedSrc(src)
          setIsResolving(false)
          return
        }
        
        // For non-thumbnail Handle.net URLs, use backend resolver
        // (images.weserv.nl can't handle HTML redirects from Handle.net)
        if (isHandleUrl(src)) {
          const resolverUrl = `/api/resolve-image?href=${encodeURIComponent(src)}&max_width=${width}`
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for image processing
          
          try {
            const response = await fetch(resolverUrl, { 
              method: 'GET',
              redirect: 'follow',
              signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            if (isMounted && response.ok) {
              const finalUrl = response.url
              
              if (looksLikeImageUrl(finalUrl)) {
                setResolvedSrc(finalUrl)
              } else {
                const fallbackUrl = src.includes('?') ? `${src}&urlappend=/mode/thumb` : `${src}?urlappend=/mode/thumb`
                setResolvedSrc(fallbackUrl)
              }
              setIsResolving(false)
            } else if (isMounted) {
              // If resolver fails (non-OK status), try adding thumbnail mode as fallback
              const fallbackUrl = src.includes('?') ? `${src}&urlappend=/mode/thumb` : `${src}?urlappend=/mode/thumb`
              setResolvedSrc(fallbackUrl)
              setIsResolving(false)
            }
          } catch (error) {
            clearTimeout(timeoutId)
            if (isMounted) {
              // Fallback to thumbnail mode
              const fallbackUrl = src.includes('?') ? `${src}&urlappend=/mode/thumb` : `${src}?urlappend=/mode/thumb`
              setResolvedSrc(fallbackUrl)
              setIsResolving(false)
            }
          }
          return
        }
        
        // For other URLs, use them directly
        if (isMounted) {
          setResolvedSrc(src)
          setIsResolving(false)
        }
      } catch (error) {
        console.error('Error resolving image:', error)
        if (isMounted) {
          // Fallback to direct URL on error
          setResolvedSrc(src)
          setIsResolving(false)
        }
      }
    }
    
    resolveImageUrl()
    
    return () => {
      isMounted = false
    }
  }, [src, width])

  const handleImageLoad = () => {
    setImageState('loaded')
  }

  const handleImageError = () => {
    setImageState('error')
  }

  // Show placeholder while resolving or if error
  if (isResolving && !resolvedSrc) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      </div>
    )
  }

  // Don't render image if failed and no resolved source
  if (imageState === 'error' && !resolvedSrc) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-gray-400" />
        </div>
      </div>
    )
  }

  // Only render img if we have a resolved source
  if (!resolvedSrc) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {imageState === 'loading' && showPlaceholder && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center z-10">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      
      <img
        src={resolvedSrc}
        alt={alt}
        sizes={sizes}
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
  const [currentPage, setCurrentPage] = useState(0)
  const [modalImageSrc, setModalImageSrc] = useState(null)
  const [modalImageLoading, setModalImageLoading] = useState(false)
  const [modalImageError, setModalImageError] = useState(false)
  const [modalVariant, setModalVariant] = useState('front')
  const [imageGridSize, setImageGridSize] = useState('cozy')
  const [showBackOnly, setShowBackOnly] = useState(false)
  const [showAllImages, setShowAllImages] = useState(false)

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
        const imageUrl = getImageUrl(obj, true) // Use thumbnail for preload
        // Only use weserv if it's a Handle.net URL, otherwise use direct URL
        if (isHandleUrl(imageUrl)) {
          img.src = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=300&h=300&fit=cover&q=85&f=webp`
        } else {
          img.src = imageUrl
        }
      })
    }
  }, [collection])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      // Fetching collection...
      const data = await archiveService.getCollectionById(id)
      // Collection data received
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
    if (!collection) return null
    const prepared = getAllCollectionImages(collection)
    if (prepared.length > 0) {
      return prepared[0].frontThumb || prepared[0].frontFull || getImageUrl(prepared[0], true)
    }
    const fallback = getFallbackImage(collection?.unit_id)
    return fallback
  }
  
  const getImageUrl = (obj, preferThumbnail = false) => {
    const resolved = resolveDigitalObjectImage(obj, preferThumbnail)
    if (resolved) return resolved
    return obj?.href || obj?.full_image || obj?.thumbnail || ''
  }
  
  const getBackImageUrl = (obj, preferThumbnail = false) => {
    if (!obj) return null
    const candidate = resolveDigitalObjectImage(
      {
        resolved_full_image: obj?.back_full_image,
        resolved_thumbnail: obj?.back_thumbnail,
        full_image: obj?.back_full_image,
        thumbnail: obj?.back_thumbnail,
        href: obj?.back_href
      },
      preferThumbnail
    )
  if (candidate) return ensureBackPage(candidate)
    
    if (obj?.back_image_id) {
      return preferThumbnail
        ? buildIiifThumbFromIdentifier(obj.back_image_id, 2)
        : buildIiifFullFromIdentifier(obj.back_image_id, 2)
    }
    
    return null
  }
  
  const getImageSignature = (obj = {}) => {
    const candidates = [
      obj.iiif_identifier,
      obj.image_id,
      obj.href,
      obj.full_image,
      obj.thumbnail,
      obj.resolved_full_image,
      obj.resolved_thumbnail
    ]
    
    for (const value of candidates) {
      if (value && typeof value === 'string') {
        try {
          return value.split('#')[0].split('?')[0].toLowerCase()
        } catch {
          return value.toLowerCase()
        }
      }
    }
    return null
  }
  
  const getAllCollectionImages = (collection) => {
    if (!collection) return []
    
    const imagesMap = new Map()
    const orderedImages = []
    
    const addImage = (obj, meta = {}) => {
      if (!obj || typeof obj !== 'object') return
      const role = (obj.role || '').toLowerCase()
      if (role === 'image-thumbnail') return
      
      const signature = getImageSignature(obj) || `${meta.source || 'collection'}-${imagesMap.size}`
      if (imagesMap.has(signature)) return
      
      const frontFull = getImageUrl(obj, false)
      const frontThumb = getImageUrl(obj, true) || frontFull
      const backFull = getBackImageUrl(obj, false)
      const backThumb = getBackImageUrl(obj, true) || backFull
      const identifier = obj.iiif_identifier || obj.image_id
      const frontPreview =
        buildIiifPreviewFromIdentifier(identifier, 900, 1) ||
        frontThumb ||
        frontFull
      const backPreview =
        buildIiifPreviewFromIdentifier(obj.back_image_id, 900, 2) ||
        backThumb ||
        backFull
      
      const enhanced = {
        ...obj,
        source: meta.source || 'collection',
        fileTitle: meta.fileTitle,
        fileId: meta.fileId,
        displayUrl: frontPreview || frontFull || obj.href || obj.full_image || obj.thumbnail,
        frontFull,
        frontThumb,
        frontPreview,
        backFull,
        backThumb,
        backPreview,
        hasBackImage: Boolean(backFull || backThumb),
        originalIndex: orderedImages.length
      }
      
      imagesMap.set(signature, enhanced)
      orderedImages.push(enhanced)
    }
    
    ;(collection.digital_objects || []).forEach(obj => addImage(obj, { source: 'collection' }))
    
    ;(collection.files || []).forEach(file => {
      (file.digital_objects || []).forEach(obj =>
        addImage(obj, { source: 'file', fileTitle: file.title, fileId: file.id })
      )
    })
    
    if (orderedImages.length === 0) {
      const fallback = getFallbackImage(collection?.unit_id)
      if (fallback) {
        const placeholder = {
          image_id: `${collection?.unit_id || 'fallback'}-cover`,
          full_image: fallback,
          thumbnail: fallback,
          resolved_full_image: fallback,
          resolved_thumbnail: fallback,
          href: fallback
        }
        addImage(placeholder, { source: 'fallback', fileTitle: collection?.title })
      }
    }

    return orderedImages
  }

  const allImages = useMemo(() => getAllCollectionImages(collection), [collection])
  const filteredImages = useMemo(
    () => (showBackOnly ? allImages.filter(img => img.hasBackImage) : allImages),
    [allImages, showBackOnly]
  )
  const previewLimit = 30
  const displayedImages = useMemo(
    () => (showAllImages ? filteredImages : filteredImages.slice(0, previewLimit)),
    [filteredImages, showAllImages, previewLimit]
  )
  const gridSizeMap = {
    compact: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4',
    cozy: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6',
    comfortable: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8'
  }
  const gridSizeLabels = {
    compact: 'Compact',
    cozy: 'Cozy',
    comfortable: 'Comfort'
  }
  const gridClassName = gridSizeMap[imageGridSize] || gridSizeMap.cozy

  const getVariantUrl = (image, variant = 'front', preferThumbnail = false) => {
    if (!image) return null
    if (variant === 'back') {
      if (preferThumbnail) {
        return image.backThumb || image.backPreview || getBackImageUrl(image, true) || image.backFull || getBackImageUrl(image, false)
      }
      return image.backFull || getBackImageUrl(image, false) || image.backPreview || image.backThumb || getBackImageUrl(image, true)
    }
    
    if (preferThumbnail) {
      return image.frontThumb || image.frontPreview || getImageUrl(image, true) || image.frontFull || getImageUrl(image, false)
    }
    return image.frontFull || getImageUrl(image, false) || image.frontPreview || image.frontThumb || getImageUrl(image, true)
  }

  const resolveVariantImage = async (image, variant = 'front') => {
    let url = getVariantUrl(image, variant, false) || getVariantUrl(image, variant, true)
    if (!url) return null
    
    if (!isHandleUrl(url)) {
      return url
    }
    
    try {
      const resolverUrl = `/api/resolve-image?href=${encodeURIComponent(url)}&max_width=1200`
      const response = await fetch(resolverUrl, { method: 'GET', redirect: 'follow' })
      if (response.ok) {
        const finalUrl = response.url
        if (looksLikeImageUrl(finalUrl)) {
          return finalUrl
        }
      }
    } catch (error) {
      console.error('Error resolving image:', error)
    }
    
    return getVariantUrl(image, variant, true) || url
  }

  const openImageModal = async (index, variant = 'front') => {
    setSelectedImageIndex(index)
    setModalVariant(variant)
    setShowImageModal(true)
    setModalImageLoading(true)
    setModalImageError(false)
    
    const currentImage = allImages[index]
    
    if (!currentImage) {
      setModalImageLoading(false)
      return
    }
    
    const resolved = await resolveVariantImage(currentImage, variant)
    if (!resolved) {
      setModalImageError(true)
      setModalImageSrc(null)
    } else {
      setModalImageSrc(resolved)
    }
    setModalImageLoading(false)
  }
  
  // Update modal image when selection or variant changes
  useEffect(() => {
    if (!showImageModal || selectedImageIndex === null) return
    const currentImage = allImages[selectedImageIndex]
    
    if (!currentImage) {
      setModalImageSrc(null)
      setModalImageLoading(false)
      return
    }
    
    let cancelled = false
    setModalImageLoading(true)
    setModalImageError(false)
    
    resolveVariantImage(currentImage, modalVariant)
      .then((url) => {
        if (!cancelled) {
          if (!url) {
            setModalImageError(true)
            setModalImageSrc(null)
          } else {
            setModalImageSrc(url)
          }
          setModalImageLoading(false)
        }
      })
      .catch((error) => {
        console.error('Error resolving image:', error)
        if (!cancelled) {
          setModalImageError(true)
          setModalImageLoading(false)
          setModalImageSrc(getVariantUrl(currentImage, modalVariant, true))
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [showImageModal, selectedImageIndex, modalVariant, allImages])

  const closeImageModal = () => {
    setShowImageModal(false)
    setSelectedImageIndex(null)
    setModalVariant('front')
  }

  const openImageBrowser = () => {
    setCurrentPage(0)
    setShowImageBrowser(true)
  }

  const closeImageBrowser = () => {
    setShowImageBrowser(false)
    setCurrentPage(0)
  }

  const nextImage = () => {
    if (selectedImageIndex < allImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
      setModalVariant('front')
    }
  }

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
      setModalVariant('front')
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
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
              <div className="flex-shrink-0 mb-6 md:mb-0">
                {getCollectionImage(collection) ? (
                  <OptimizedImage
                    src={getCollectionImage(collection)}
                    alt={collection.title}
                    className="w-full md:w-64 h-48 rounded-xl shadow-lg"
                    width={400}
                    height={300}
                    quality={90}
                    loading="eager"
                    showPlaceholder={true}
                  />
                ) : (
                  <div className="w-full md:w-64 h-48 flex items-center justify-center bg-gradient-to-br from-blue-300 to-blue-400 rounded-xl shadow-lg">
                    <Archive className="h-16 w-16 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {collection.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <span className="font-semibold text-gray-700">ID:</span> 
                    <span className="ml-1 text-gray-600 font-mono">{collection.unit_id}</span>
                  </span>
                  {collection.date_inclusive && (
                    <span className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                      <span className="font-semibold text-blue-700">Date:</span> 
                      <span className="ml-1 text-blue-600">{formatDate(collection.date_inclusive)}</span>
                    </span>
                  )}
                  {collection.finding_aid_status && (
                    <span className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide">
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
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                    Abstract
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{collection.abstract}</p>
                </div>
              )}

              {/* Scope and Content */}
              {collection.scope_content && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                    Scope and Content
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{collection.scope_content}</p>
                </div>
              )}

              {/* Biographical/Historical */}
              {collection.biographical_historical && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                    Biographical/Historical
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{collection.biographical_historical}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Physical Description */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                  Physical Description
                </h3>
                <div className="space-y-3">
                  {collection.extent && (
                    <p className="text-sm text-gray-700 flex items-start">
                      <span className="font-semibold min-w-[80px]">Extent:</span> 
                      <span className="flex-1">{collection.extent}</span>
                    </p>
                  )}
                  {collection.carrier && (
                    <p className="text-sm text-gray-700 flex items-start">
                      <span className="font-semibold min-w-[80px]">Carrier:</span> 
                      <span className="flex-1">{collection.carrier}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Languages */}
              {collection.languages && collection.languages.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                    Languages
                  </h3>
                  <p className="text-sm text-gray-700">{getLanguageText(collection.languages)}</p>
                </div>
              )}


              {/* Repository */}
              {collection.repository && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-1 h-6 bg-blue-600 mr-3 rounded"></span>
                    Repository
                  </h3>
                  <p className="text-sm text-gray-700">{collection.repository}</p>
                </div>
              )}

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

        {/* Collection Images */}
        {filteredImages.length > 0 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-lg w-full mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Camera className="h-5 w-5 text-blue-600 mr-3" />
                  Collection Images
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredImages.length})
                  </span>
                </h3>
                <p className="text-sm text-gray-500">
                  Curated directly from the finding aid with duplicates removed
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-gray-100 rounded-full p-1 flex">
                  {['compact', 'cozy', 'comfortable'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setImageGridSize(size)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                        imageGridSize === size
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {gridSizeLabels[size]}
                    </button>
                  ))}
                </div>
                <label className="inline-flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showBackOnly}
                    onChange={(e) => setShowBackOnly(e.target.checked)}
                    className="mr-2 accent-blue-600"
                  />
                  Only show images with backs
                </label>
                <button
                  onClick={() => setShowImageBrowser(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Browse All
                </button>
              </div>
            </div>
            
            <div className={`grid ${gridClassName}`}>
              {displayedImages.map((obj, index) => {
                const globalIndex = obj.originalIndex ?? index
                const previewSrc = obj.frontPreview || obj.frontThumb || obj.frontFull || obj.displayUrl
                return (
                  <button
                    key={`${obj.iiif_identifier || obj.image_id || index}`}
                    className="group relative text-left bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-2xl transition-all overflow-hidden p-3"
                    onClick={() => openImageModal(globalIndex)}
                    title={obj.title || `Image ${globalIndex + 1}`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gray-200 rounded-2xl">
                      <OptimizedImage
                        src={previewSrc}
                        alt={obj.title || `Image ${globalIndex + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={480}
                        height={600}
                        quality={85}
                        loading="lazy"
                        showPlaceholder={true}
                        sizes="(min-width:1280px) 18vw, (min-width:1024px) 22vw, (min-width:768px) 30vw, 80vw"
                      />
                    </div>
                    <div className="px-2 pt-4 pb-1 space-y-2">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                        {obj.title || `Image ${globalIndex + 1}`}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {obj.source === 'collection' ? 'Collection level' : obj.fileTitle || 'File image'}
                        </span>
                        {obj.hasBackImage && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                            Front + Back
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <div className="mt-6 text-center space-y-2">
              {!showAllImages && filteredImages.length > previewLimit && (
                <button
                  onClick={() => setShowAllImages(true)}
                  className="inline-flex items-center px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors text-base shadow-md hover:shadow-lg"
                >
                  Load all {filteredImages.length} images
                </button>
              )}
              <div>
                <button
                  onClick={() => setShowImageBrowser(true)}
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-base shadow-md hover:shadow-lg"
                >
                  Browse in fullscreen →
                </button>
              </div>
            </div>
          </div>
        )}

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
        const currentImage = allImages[selectedImageIndex]
        
        if (!currentImage) return null
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative max-w-5xl w-full max-h-full p-4 flex items-center justify-center">
              {/* Close button */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-2"
              >
                <X className="h-6 w-6" />
              </button>
              
              {currentImage.hasBackImage && (
                <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-60 rounded-full p-1 flex gap-1">
                  {['front', 'back'].map((variant) => (
                    <button
                      key={variant}
                      onClick={() => setModalVariant(variant)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        modalVariant === variant
                          ? 'bg-white text-blue-600'
                          : 'text-white hover:text-blue-200'
                      }`}
                    >
                      {variant === 'front' ? 'Front' : 'Back'}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Navigation buttons */}
              {selectedImageIndex > 0 && (
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-3"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}
              
              {selectedImageIndex < allImages.length - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-3"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
              
              {/* Image Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-full min-h-[200px] flex items-center justify-center">
                  {modalImageLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                      <p className="text-sm tracking-wide uppercase">Loading high-res image…</p>
                    </div>
                  )}
                  
                  {modalImageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gray-800 rounded-lg p-8 text-white text-center">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Failed to load image</p>
                        <button
                          onClick={() => {
                            const thumbnailUrl = getVariantUrl(currentImage, modalVariant, true)
                            if (thumbnailUrl) {
                              setModalImageSrc(thumbnailUrl)
                              setModalImageError(false)
                              setModalImageLoading(true)
                            }
                          }}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Try Thumbnail
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {modalImageSrc && !modalImageError && (
                    <img
                      src={modalImageSrc}
                      alt={
                        currentImage.title
                          || `${modalVariant === 'back' ? 'Back of' : 'Image'} ${selectedImageIndex + 1}`
                      }
                      className={`max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                        modalImageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                      onLoad={() => {
                        setModalImageLoading(false)
                        setModalImageError(false)
                      }}
                      onError={(e) => {
                        setModalImageError(true)
                        setModalImageLoading(false)
                        const thumbnailUrl = getVariantUrl(currentImage, modalVariant, true)
                        if (thumbnailUrl && thumbnailUrl !== e.target.src) {
                          setTimeout(() => {
                            setModalImageSrc(thumbnailUrl)
                            setModalImageError(false)
                            setModalImageLoading(true)
                          }, 1000)
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Image info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-300 mb-1">
                      {modalVariant === 'back' ? 'Back of photograph' : 'Front of photograph'}
                    </p>
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
        return (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-hidden">
            <div className="relative w-full h-full flex flex-col p-4">
              {/* Close button */}
              <button
                onClick={closeImageBrowser}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full p-2"
              >
                <X className="h-6 w-6" />
              </button>
              
              {/* Header */}
              <div className="text-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-white mb-2">
                  All Collection Images ({allImages.length})
                </h2>
                <p className="text-gray-300 text-sm">Click on any image to view it in detail</p>
              </div>
              
              {/* Images Grid with pagination - Medium-sized images, scrollable */}
              {(() => {
                const pageSize = 24 // Show 24 images per page (4x6 or 6x4 grid)
                const start = currentPage * pageSize
                const end = Math.min(start + pageSize, allImages.length)
                const pageImages = allImages.slice(start, end)
                const totalPages = Math.ceil(allImages.length / pageSize)

                return (
                  <>
                    {/* Scrollable Image Grid Container - Takes remaining space */}
                    <div className="flex-1 overflow-y-auto mb-4 pr-2 min-h-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 p-4">
                        {pageImages.map((obj, index) => (
                          <div 
                            key={start + index} 
                            className="group cursor-pointer bg-white/5 rounded-2xl border border-white/10 hover:border-blue-300/50 transition-all"
                            onClick={() => {
                              setShowImageBrowser(false)
                              openImageModal(start + index, 'front')
                            }}
                            title={obj.title || `Image ${start + index + 1}`}
                          >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-900">
                              <OptimizedImage
                                src={obj.frontPreview || obj.frontThumb || obj.frontFull || obj.displayUrl}
                                alt={obj.title || `Image ${start + index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                width={320}
                                height={420}
                                quality={85}
                                loading="lazy"
                                showPlaceholder={true}
                                sizes="(min-width:1280px) 15vw, (min-width:1024px) 18vw, (min-width:768px) 25vw, 50vw"
                              />
                              {obj.hasBackImage && (
                                <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                  Back available
                                </span>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-semibold text-white line-clamp-2 min-h-[2.5rem]">
                                {obj.title || `Image ${start + index + 1}`}
                              </p>
                              <div className="text-xs text-gray-300 mt-1">
                                {obj.source === 'file' ? obj.fileTitle || 'File image' : 'Collection level'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Enhanced Pagination Controls - Fixed at bottom */}
                    {totalPages > 1 && (
                      <div className="bg-black bg-opacity-60 rounded-xl p-4 flex-shrink-0">
                        {/* Page info */}
                        <div className="text-center mb-4">
                          <div className="text-white text-lg font-semibold mb-1">
                            Page <span className="text-blue-400">{currentPage + 1}</span> of <span className="text-blue-400">{totalPages}</span>
                          </div>
                          <div className="text-gray-300 text-sm">
                            Showing {start + 1}-{end} of {allImages.length} images
                          </div>
                        </div>
                        
                        {/* Navigation buttons */}
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <button
                            onClick={() => setCurrentPage(0)}
                            disabled={currentPage === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
                            title="First page"
                          >
                            ««
                          </button>
                          
                          <button
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
                          >
                            ← Previous
                          </button>
                          
                          {/* Page number buttons */}
                          <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i;
                              } else if (currentPage < 3) {
                                pageNum = i;
                              } else if (currentPage > totalPages - 4) {
                                pageNum = totalPages - 5 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-md ${
                                    currentPage === pageNum
                                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                      : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                                  }`}
                                >
                                  {pageNum + 1}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
                          >
                            Next →
                          </button>
                          
                          <button
                            onClick={() => setCurrentPage(totalPages - 1)}
                            disabled={currentPage >= totalPages - 1}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
                            title="Last page"
                          >
                            »»
                          </button>
                        </div>
                        
                        {/* Quick jump to page */}
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <span className="text-gray-300 text-sm font-medium">Go to page:</span>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            defaultValue={currentPage + 1}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const page = parseInt(e.target.value)
                                if (page >= 1 && page <= totalPages) {
                                  setCurrentPage(page - 1)
                                  e.target.blur()
                                }
                              }
                            }}
                            className="w-20 px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={String(currentPage + 1)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default ArchiveCollectionDetail
