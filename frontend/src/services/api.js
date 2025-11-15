import axios from 'axios'
import { secureApiCall, validateInput, clientRateLimit } from '../utils/security'

const API_BASE_URL = '/api'
const IIIF_IMAGE_BASE = 'https://sites.dlib.nyu.edu/viewer/api/image'

const isHandleUrl = (url) => typeof url === 'string' && url.includes('hdl.handle.net')

const normalizeImageIdentifier = (imageId) => {
  if (!imageId || typeof imageId !== 'string') return null
  const withoutQuery = imageId.split('#')[0].split('?')[0].trim()
  if (!withoutQuery) return null
  const stripped = withoutQuery.replace(/^\/+/, '').replace(/\/+$/, '')
  return stripped.replace(/\/{2,}/g, '/')
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

const buildIiifFullUrl = (imageId, page = 1) => {
  if (!imageId) return null
  const cleanId = normalizeImageIdentifier(imageId)
  if (!cleanId) return null
  const identifier = appendPageSegment(cleanId, page)
  return `${IIIF_IMAGE_BASE}/${identifier}/full/full/0/default.jpg`
}

const buildIiifThumbUrl = (imageId, page = 1) => {
  if (!imageId) return null
  const cleanId = normalizeImageIdentifier(imageId)
  if (!cleanId) return null
  const identifier = appendPageSegment(cleanId, page)
  return `${IIIF_IMAGE_BASE}/${identifier}/full/!300,300/0/default.jpg`
}

const extractImageIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  try {
    const { pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)
    const viewerIndex = segments.indexOf('viewer')
    if (viewerIndex === -1) return null
    const afterViewer = segments.slice(viewerIndex + 1)
    if (afterViewer.length === 0) return null

    const buildIdentifier = (typeSegment, idSegment, pageSegment) => {
      if (!typeSegment || !idSegment) return null
      const base = `${typeSegment}/${idSegment}`
      if (pageSegment && /^\d+$/.test(pageSegment)) {
        return `${base}/${pageSegment}`
      }
      return base
    }

    if (afterViewer[0] === 'api' && afterViewer[1] === 'image') {
      const typeSegment = afterViewer[2]
      const idSegment = afterViewer[3]
      const pageSegment = afterViewer[4] && /^\d+$/.test(afterViewer[4]) ? afterViewer[4] : null
      return buildIdentifier(typeSegment, idSegment, pageSegment)
    }

    const typeSegment = afterViewer[0]
    const idSegment = afterViewer[1]
    const pageSegment = afterViewer[2] && /^\d+$/.test(afterViewer[2]) ? afterViewer[2] : null
    return buildIdentifier(typeSegment, idSegment, pageSegment)
  } catch {
    return null
  }
}

const normalizeDigitalObject = (obj = {}) => {
  if (!obj || typeof obj !== 'object') return obj
  const normalized = { ...obj }
  
  const rawImageId =
    normalized.image_id ||
    extractImageIdFromUrl(normalized.full_image) ||
    extractImageIdFromUrl(normalized.thumbnail) ||
    extractImageIdFromUrl(normalized.href)
  const imageId = normalizeImageIdentifier(rawImageId)
  const pageNumber = 1
  
  if (imageId) {
    normalized.iiif_identifier = imageId
  }
  
  let resolvedFull = imageId ? buildIiifFullUrl(imageId, pageNumber) : null
  
  if (!resolvedFull) {
    if (normalized.full_image && !isHandleUrl(normalized.full_image)) {
      resolvedFull = normalized.full_image
    } else if (normalized.href && !isHandleUrl(normalized.href) && !normalized.href.includes('?urlappend=/mode/thumb')) {
      resolvedFull = normalized.href
    }
  }
  
  let resolvedThumb = imageId ? buildIiifThumbUrl(imageId, pageNumber) : null
  
  if (
    !resolvedThumb &&
    normalized.thumbnail &&
    !isHandleUrl(normalized.thumbnail) &&
    !normalized.thumbnail.includes('?urlappend=/mode/thumb')
  ) {
    resolvedThumb = normalized.thumbnail
  }
  
  if (!resolvedThumb && resolvedFull && !isHandleUrl(resolvedFull)) {
    resolvedThumb = resolvedFull
  }
  
  normalized.resolved_full_image = resolvedFull || null
  normalized.resolved_thumbnail = resolvedThumb || null
  
  return normalized
}

const normalizeDigitalObjects = (objects) => {
  if (!objects) return []
  let parsed = objects
  if (typeof objects === 'string') {
    try {
      parsed = JSON.parse(objects)
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map(normalizeDigitalObject)
}

const normalizeCollectionImages = (collection) => {
  if (!collection || typeof collection !== 'object') return collection
  
  const normalized = { ...collection }
  normalized.digital_objects = normalizeDigitalObjects(collection.digital_objects)
  
  let files = collection.files
  if (typeof files === 'string') {
    try {
      files = JSON.parse(files)
    } catch {
      files = []
    }
  }
  if (Array.isArray(files)) {
    normalized.files = files.map((file) => ({
      ...file,
      digital_objects: normalizeDigitalObjects(file?.digital_objects)
    }))
  } else {
    normalized.files = []
  }
  
  let series = collection.series
  if (typeof series === 'string') {
    try {
      series = JSON.parse(series)
    } catch {
      series = []
    }
  }
  if (Array.isArray(series)) {
    normalized.series = series.map((item) => ({
      ...item,
      digital_objects: normalizeDigitalObjects(item?.digital_objects)
    }))
  } else {
    normalized.series = []
  }
  
  return normalized
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add rate limiting check
    if (!clientRateLimit.canMakeRequest()) {
      return Promise.reject(new Error('Rate limit exceeded. Please try again later.'))
    }
    
    // Validate request data
    if (config.data) {
      // Basic validation for search queries
      if (config.url?.includes('search') && config.data.query) {
        if (!validateInput(config.data.query, 'search')) {
          return Promise.reject(new Error('Invalid search query'))
        }
      }
    }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Check for security headers
    const securityHeaders = {
      'X-Content-Type-Options': response.headers['x-content-type-options'],
      'X-Frame-Options': response.headers['x-frame-options'],
      'X-XSS-Protection': response.headers['x-xss-protection'],
    }
    
    // Log missing security headers in development
    if (process.env.NODE_ENV === 'development') {
      Object.entries(securityHeaders).forEach(([header, value]) => {
        if (!value) {
          console.warn(`Missing security header: ${header}`)
        }
      })
    }
    
    return response
  },
  (error) => {
    // Handle different types of errors securely
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      if (status === 429) {
        console.warn('Rate limit exceeded')
      } else if (status >= 500) {
        console.error('Server error:', status)
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message)
    } else {
      // Other error
      console.error('Request setup error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Collection Service
export const collectionService = {
  getAllCollections: async () => {
    try {
      const response = await api.get('/collections')
      return response.data
    } catch (error) {
      // Return mock data if API is not available
      return getMockCollections()
    }
  },

  getCollectionById: async (id) => {
    try {
      const response = await api.get(`/collections/${id}`)
      return response.data
    } catch (error) {
      // Return mock data if API is not available
      return getMockCollectionById(id)
    }
  },

  searchCollections: async (query) => {
    try {
      const response = await api.get('/collections/search', { params: { q: query } })
      return response.data
    } catch (error) {
      // Return mock data if API is not available
      return getMockSearchResults(query)
    }
  }
}

// Search Service
export const searchService = {
  search: async (params) => {
    try {
      const response = await api.post('/search', params)
      return response.data
    } catch (error) {
      // Return mock data if API is not available
      return getMockSearchResults(params.query)
    }
  }
}

// Archive Service
export const archiveService = {
  // Normalize collection response by resolving handle thumbnails
  _normalizeCollection: (collection) => normalizeCollectionImages(collection),

  // Get all archive collections
  getAllCollections: async (params = {}) => {
    try {
      console.log('Making API call to /archive/collections with params:', params)
      const response = await api.get('/archive/collections', { params })
      console.log('API response:', response)
      console.log('API response data:', response.data)
      
      // Return data and metadata
      const data = Array.isArray(response.data) ? response.data : []
      const normalizedData = data.map((collection) => normalizeCollectionImages(collection))

      return {
        data: normalizedData,
        total: response.headers['x-total-count'] ? parseInt(response.headers['x-total-count']) : normalizedData.length
      }
    } catch (error) {
      console.error('Error fetching archive collections:', error)
      return { data: [], total: 0 }
    }
  },

  // Get collection by ID
  getCollectionById: async (id) => {
    try {
      const response = await api.get(`/archive/collections/${id}`)
      console.log('Collection response:', response)
      console.log('Collection response data:', response.data)
      // The backend returns data directly as the response, not wrapped in data property
      // Check if response.data exists and has an id, otherwise use response directly
      if (response.data && response.data.id) {
        return normalizeCollectionImages(response.data)
      } else if (response.data) {
        return normalizeCollectionImages(response.data)
      } else {
        console.error('Unexpected response format:', response)
        return null
      }
    } catch (error) {
      console.error('Error fetching archive collection:', error)
      return null
    }
  },

  // Get series for a collection
  getCollectionSeries: async (collectionId) => {
    try {
      const response = await api.get(`/archive/collections/${collectionId}/series`)
      return response.data || []
    } catch (error) {
      console.error('Error fetching collection series:', error)
      return []
    }
  },

  // Get series by ID
  getSeriesById: async (id) => {
    try {
      const response = await api.get(`/archive/series/${id}`)
      return response.data || null
    } catch (error) {
      console.error('Error fetching series:', error)
      return null
    }
  },

  // Advanced search
  search: async (params) => {
    try {
      const response = await api.get('/archive/search', { params })
      return response.data
    } catch (error) {
      console.error('Error searching archive:', error)
      return { collections: [], series: [], files: [], total_results: 0 }
    }
  },

  // Get archive statistics
  getStats: async () => {
    try {
      const response = await api.get('/archive/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching archive stats:', error)
      return { total_collections: 0, total_series: 0, total_files: 0 }
    }
  }
}

// Mock data functions (for development)
const getMockCollections = () => {
  return [
    {
      id: 1,
      title: "Early Photography in the Holy Lands",
      description: "A comprehensive collection of 19th-century photographs documenting the Holy Lands, featuring early landscape photography and architectural documentation from Palestine, Syria, and Lebanon.",
      imageCount: 1250,
      period: "1850-1900",
      type: "Historical",
      collectionType: "Landscape Photography",
      historicalContext: "This collection represents some of the earliest photographic documentation of the Holy Lands, capturing the region during a period of significant change and development."
    },
    {
      id: 2,
      title: "Ottoman Empire Portraits",
      description: "Studio portraits and family photographs from the Ottoman period, showcasing the diverse communities and social structures of the empire through intimate photographic documentation.",
      imageCount: 890,
      period: "1870-1920",
      type: "Historical",
      collectionType: "Portrait Photography",
      historicalContext: "These portraits provide insight into the social fabric of the Ottoman Empire, featuring individuals from various ethnic and religious backgrounds."
    },
    {
      id: 3,
      title: "Egyptian Cinema Archive",
      description: "Behind-the-scenes photographs from the golden age of Egyptian cinema, documenting the production process, actors, and cultural impact of film in the region.",
      imageCount: 2100,
      period: "1940-1970",
      type: "Contemporary",
      collectionType: "Documentary Photography",
      historicalContext: "This collection captures the vibrant film industry of mid-20th century Egypt, showcasing the cultural and artistic achievements of the period."
    },
    {
      id: 4,
      title: "Family Albums Collection",
      description: "Digitized family photographic albums from across the Middle East and North Africa, preserving personal histories and cultural traditions.",
      imageCount: 3400,
      period: "1900-2000",
      type: "Photo Albums",
      collectionType: "Family Archives",
      historicalContext: "These family albums offer intimate glimpses into daily life, celebrations, and personal histories across different communities in the region."
    },
    {
      id: 5,
      title: "Urban Development in the Gulf",
      description: "Contemporary documentary photography documenting the rapid urbanization and development of Gulf cities from the 1960s to present.",
      imageCount: 1800,
      period: "1960-Present",
      type: "Contemporary",
      collectionType: "Documentary Photography",
      historicalContext: "This collection documents the transformation of Gulf cities, capturing both the rapid development and the preservation of cultural heritage."
    },
    {
      id: 6,
      title: "Berber Cultural Heritage",
      description: "Photographic documentation of Berber communities across North Africa, preserving traditional practices, crafts, and cultural expressions.",
      imageCount: 950,
      period: "1920-1980",
      type: "Historical",
      collectionType: "Ethnographic Photography",
      historicalContext: "This collection focuses on the preservation of Berber cultural practices and traditions through photographic documentation."
    }
  ]
}

const getMockCollectionById = (id) => {
  const collections = getMockCollections()
  return collections.find(collection => collection.id === parseInt(id)) || null
}

const getMockSearchResults = (query) => {
  const collections = getMockCollections()
  if (!query) return []
  
  return collections.filter(collection => 
    collection.title.toLowerCase().includes(query.toLowerCase()) ||
    collection.description.toLowerCase().includes(query.toLowerCase()) ||
    collection.type.toLowerCase().includes(query.toLowerCase())
  )
}

export default api
