import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Camera, ArrowRight, Archive, X, ChevronDown, ChevronUp } from 'lucide-react'
import { archiveService } from '../services/api'
import { COLLECTION_IMAGE_MAP } from '../constants/collectionImages'

const HISTORICAL_COLLECTION_IDS = [
  'AD.MC.012',
  'AD.MC.036',
  'AD.MC.056',
  'AD.MC.031',
  'AD.MC.002',
  'AD.MC.011',
  'AD.MC.020',
  'AD.MC.030',
  'AD.MC.028',
  'AD.MC.007',
  'AD.MC.050'
]

const PHOTO_ALBUM_COLLECTION_IDS = [
  'AD.MC.013.v1',
  'AD.MC.013.v2',
  'AD.MC.027',
  'AD.MC.014',
  'AD.MC.015',
  'AD.MC.030_ref149',
  'AD.MC.030_ref150',
  'AD.MC.030_ref158',
  'AD.MC.030_ref163',
  'AD.MC.030_ref159',
  'AD.MC.030_ref184',
  'AD.MC.030_ref151',
  'AD.MC.063',
  'AD.MC.062',
  'AD.MC.061',
  'AD.MC.040',
  'AD.MC.042',
  'AD.MC.043',
  'AD.MC.044',
  'AD.MC.049',
  'AD.MC.045',
  'AD.MC.046',
  'AD.MC.047',
  'AD.MC.048',
  'AD.MC.030_ref162',
  'AD.MC.030_ref160',
  'AD.MC.030_ref161',
  'AD.MC.030_ref170',
  'AD.MC.030_ref165',
  'AD.MC.030_ref166',
  'AD.MC.030_ref171',
  'AD.MC.030_ref172',
  'AD.MC.030_ref176',
  'AD.MC.030_ref178',
  'AD.MC.030_ref177',
  'AD.MC.030_ref175',
  'AD.MC.030_ref174',
  'AD.MC.030_ref164',
  'AD.MC.030_ref173',
  'AD.MC.030_ref169',
  'AD.MC.055',
  'AD.MC.041',
  'AD.MC.066',
  'AD.MC.067'
]

const CONTEMPORARY_COLLECTION_IDS = ['AD.MC.021', 'AD.MC.026', 'AD.MC.016']

const CATEGORY_DESCRIPTIONS = {
  historical: 'Our historical collections range from the nineteenth century to the late twentieth. They cover a variety of themes and topics, from early images of the Holy Lands and from the Ottoman Empire, to images from family albums, institutional archives and the history of Egyptian cinema.',
  photoAlbums: 'Akkasah’s collection of photographic albums from the region has been created in collaboration with the Library at NYUAD. The albums are housed in Special Collections in the Library and their digitized versions are available on this website.',
  contemporary: 'Akkasah commissions and supports documentary photographic projects focused on the Middle East and North Africa. For the documentary projects, each photographer has created an exhibition of selected photographs on this site; additional images are also archived by Akkasah and can be viewed upon request, and with the agreement of the photographer.'
}

const TAB_CONFIG = [
  { id: 'historical', label: 'Historical Collections', description: CATEGORY_DESCRIPTIONS.historical },
  { id: 'photoAlbums', label: 'Photo Albums', description: CATEGORY_DESCRIPTIONS.photoAlbums },
  { id: 'contemporary', label: 'Contemporary Projects', description: CATEGORY_DESCRIPTIONS.contemporary }
]

const Collections = () => {
  const [archiveCollections, setArchiveCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [activeTab, setActiveTab] = useState('historical')
  
  // Advanced search filters
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    language: '',
    collectionType: '',
    hasImages: '',
    sortBy: 'title',
    sortOrder: 'asc'
  })

  const periods = ['1850-1900', '1900-1950', '1950-2000', '2000-Present']
  const types = ['Historical', 'Contemporary', 'Photo Albums', 'Family Archives']
  const languages = ['English', 'Arabic', 'French', 'German', 'Turkish', 'Italian', 'Spanish']
  const collectionTypes = ['Photographs', 'Documents', 'Mixed Media', 'Digital Files']
  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'date', label: 'Date' },
    { value: 'created', label: 'Created Date' },
    { value: 'relevance', label: 'Relevance' }
  ]

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      console.log('Starting to fetch collections...')
      const archiveData = await archiveService.getAllCollections()
      const collectionsData = Array.isArray(archiveData?.data)
        ? archiveData.data
        : Array.isArray(archiveData)
          ? archiveData
          : []
      console.log('Fetched archive data:', archiveData)
      console.log('Number of collections:', collectionsData.length)
      console.log('Type of archiveData:', typeof archiveData)
      console.log('Is array?', Array.isArray(collectionsData))
      setArchiveCollections(collectionsData)
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFallbackImage = (unitId) =>
    (unitId && COLLECTION_IMAGE_MAP[unitId]) || COLLECTION_IMAGE_MAP.fallback || null

  const getAllCollectionImages = (collection) => {
    const allImages = []
    
    // Add collection-level digital objects
    if (collection.digital_objects && collection.digital_objects.length > 0) {
      allImages.push(...collection.digital_objects)
    }
    
    // Add file-level digital objects
    if (collection.files && collection.files.length > 0) {
      for (const file of collection.files) {
        if (file.digital_objects && file.digital_objects.length > 0) {
          allImages.push(...file.digital_objects)
        }
      }
    }
    
    if (allImages.length === 0) {
      const fallback = getFallbackImage(collection?.unit_id)
      if (fallback) {
        allImages.push({
          image_id: `${collection?.unit_id || 'fallback'}-cover`,
          full_image: fallback,
          thumbnail: fallback,
          resolved_full_image: fallback,
          resolved_thumbnail: fallback
        })
      }
    }
    
    return allImages
  }

  const filteredArchiveCollections = (archiveCollections || []).filter(collection => {
    // Basic search
    const matchesSearch = searchQuery === '' || 
      collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (collection.abstract && collection.abstract.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (collection.scope_content && collection.scope_content.toLowerCase().includes(searchQuery.toLowerCase()))

    // Advanced filters
    const matchesDateFrom = !advancedFilters.dateFrom || 
      (collection.date_inclusive && collection.date_inclusive >= advancedFilters.dateFrom)
    
    const matchesDateTo = !advancedFilters.dateTo || 
      (collection.date_inclusive && collection.date_inclusive <= advancedFilters.dateTo)
    
    const matchesLanguage = !advancedFilters.language || 
      (collection.languages && collection.languages.some(lang => 
        (lang.text || lang).toLowerCase().includes(advancedFilters.language.toLowerCase())
      ))
    
    const matchesCollectionType = !advancedFilters.collectionType ||
      (collection.collection_type && collection.collection_type.toLowerCase().includes(advancedFilters.collectionType.toLowerCase()))
    
    const matchesHasImages = !advancedFilters.hasImages ||
      (advancedFilters.hasImages === 'yes' && getAllCollectionImages(collection).length > 0) ||
      (advancedFilters.hasImages === 'no' && getAllCollectionImages(collection).length === 0)

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesLanguage && 
           matchesCollectionType && matchesHasImages
  }).sort((a, b) => {
    // Sorting logic
    switch (advancedFilters.sortBy) {
      case 'title':
        return advancedFilters.sortOrder === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      case 'date':
        return advancedFilters.sortOrder === 'asc'
          ? (a.date_inclusive || '').localeCompare(b.date_inclusive || '')
          : (b.date_inclusive || '').localeCompare(a.date_inclusive || '')
      case 'created':
        return advancedFilters.sortOrder === 'asc'
          ? (a.created_at || '').localeCompare(b.created_at || '')
          : (b.created_at || '').localeCompare(a.created_at || '')
      default:
        return 0
    }
  })

  console.log('Archive collections state:', archiveCollections)
  console.log('Filtered collections:', filteredArchiveCollections)

  const handleAdvancedFilterChange = (field, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      language: '',
      collectionType: '',
      hasImages: '',
      sortBy: 'title',
      sortOrder: 'asc'
    })
  }

  const hasActiveFilters = () => {
    return Object.values(advancedFilters).some(value => value !== '' && value !== 'title' && value !== 'asc')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    return dateString
  }

  const getLanguageText = (languages) => {
    if (!languages || !Array.isArray(languages)) return 'Unknown'
    return languages.map(lang => lang.text || lang).join(', ')
  }

  const resolveObjectImage = (obj, preferThumbnail = false) => {
    if (!obj || typeof obj !== 'object') return null
    
    const preferredOrder = preferThumbnail
      ? [obj.resolved_thumbnail, obj.resolved_full_image, obj.thumbnail, obj.full_image, obj.href]
      : [obj.resolved_full_image, obj.resolved_thumbnail, obj.full_image, obj.thumbnail, obj.href]
    
    return preferredOrder.find(
      (url) => typeof url === 'string' && url && !url.includes('hdl.handle.net')
    ) || null
  }

  const getCollectionImage = (collection) => {
    const pickFromObjects = (objects = []) => {
      if (!Array.isArray(objects)) return null
      for (const obj of objects) {
        const resolved = resolveObjectImage(obj, false)
        if (resolved) return resolved
      }
      return null
    }
    const collectionLevel = pickFromObjects(collection?.digital_objects)
    if (collectionLevel) return collectionLevel
    if (Array.isArray(collection?.files)) {
      for (const file of collection.files) {
        const fileImage = pickFromObjects(file.digital_objects)
        if (fileImage) return fileImage
      }
    }
    return getFallbackImage(collection?.unit_id)
  }

  const categorizedCollections = useMemo(() => {
    const normalizeId = (id) => (id ? id.replace(/_/g, '.').trim() : '')
    const buckets = {
      historical: [],
      photoAlbums: [],
      contemporary: []
    }

    filteredArchiveCollections.forEach((collection) => {
      const unitId = normalizeId(collection?.unit_id)
      let assigned = false

      if (HISTORICAL_COLLECTION_IDS.includes(unitId)) {
        buckets.historical.push(collection)
        assigned = true
      }
      if (PHOTO_ALBUM_COLLECTION_IDS.includes(unitId)) {
        buckets.photoAlbums.push(collection)
        assigned = true
      }
      if (CONTEMPORARY_COLLECTION_IDS.includes(unitId)) {
        buckets.contemporary.push(collection)
        assigned = true
      }

      if (!assigned) {
        const type = (collection?.collection_type || '').toLowerCase()
        if (type.includes('photo')) {
          buckets.photoAlbums.push(collection)
        } else if (type.includes('contemporary')) {
          buckets.contemporary.push(collection)
        } else {
          buckets.historical.push(collection)
        }
      }
    })

    return buckets
  }, [filteredArchiveCollections])

  const tabCounts = useMemo(() => ({
    historical: categorizedCollections.historical.length,
    photoAlbums: categorizedCollections.photoAlbums.length,
    contemporary: categorizedCollections.contemporary.length
  }), [categorizedCollections])

  useEffect(() => {
    if (filteredArchiveCollections.length === 0) return
    const currentCount = tabCounts[activeTab] || 0
    if (currentCount > 0) return
    const fallbackTab = TAB_CONFIG.find(tab => (tabCounts[tab.id] || 0) > 0)
    if (fallbackTab && fallbackTab.id !== activeTab) {
      setActiveTab(fallbackTab.id)
    }
  }, [filteredArchiveCollections, tabCounts, activeTab])

  const renderCollectionCard = (collection) => {
    const collectionImage = getCollectionImage(collection)
    return (
      <div key={collection.id} className="card group hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        <Link 
          to={`/archive/collections/${collection.id}`}
          className="flex-1 flex flex-col"
        >
          <div className="relative w-full h-64 bg-primary-200 rounded-t-xl overflow-hidden flex-shrink-0">
            {collectionImage ? (
              <img 
                src={collectionImage}
                alt={collection.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const imgEl = e.target
                  const attemptedFallback = imgEl.dataset.fallbackTried === 'true'
                  if (!attemptedFallback) {
                    imgEl.dataset.fallbackTried = 'true'
                    imgEl.src = `https://images.weserv.nl/?url=${encodeURIComponent(collectionImage)}&w=600&h=400&fit=cover&q=85&f=webp`
                    return
                  }
                  imgEl.style.display = 'none'
                }}
                onLoad={(e) => {
                  e.target.dataset.fallbackTried = 'true'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-50">
                <Camera className="h-10 w-10 text-primary-300" />
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {formatDate(collection.date_inclusive)}
              </span>
              <span className="text-xs text-primary-400 font-mono">{collection.unit_id}</span>
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 min-h-[3.5rem]">
              {collection.title}
            </h3>
            <p className="text-primary-600 mb-4 line-clamp-3 flex-1 text-sm leading-relaxed">
              {collection.abstract || 'Archive collection'}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
              <span className="text-xs text-primary-500 bg-blue-50 px-3 py-1.5 rounded-lg font-medium">
                Archive Collection
              </span>
              <div className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm">
                View Details
                <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          </div>
        </Link>
        {collection.file_path && (
          <div className="px-6 pb-6 pt-0">
            <a 
              href={`file://${collection.file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center hover:underline"
            >
              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Finding Aid
            </a>
          </div>
        )}
      </div>
    )
  }

  const renderCategorySection = (title, description, items) => (
    <section className="mb-16" key={title}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">{title}</h2>
          <p className="text-primary-600 mt-2 max-w-4xl">{description}</p>
        </div>
        <span className="text-sm text-primary-500 font-medium">{items.length} collections</span>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((collection) => renderCollectionCard(collection))}
        </div>
      ) : (
        <div className="p-6 border border-dashed border-primary-200 rounded-xl text-primary-500 text-sm">
          No collections match your current filters in this section.
        </div>
      )}
    </section>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto"></div>
            <p className="mt-4 text-primary-600">Loading collections...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            Collections
          </h1>
          <p className="text-xl text-primary-600 max-w-3xl">
            Explore our extensive archive of photographic collections from the Middle East and North Africa
          </p>
        </div>
      </div>


      {/* Filters */}
      <div className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-400" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                />
              </div>
            </div>

            {/* Period Filter */}
            <div className="lg:w-48">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
              >
                <option value="">All Periods</option>
                {periods.map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="lg:w-48">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Advanced Search Toggle */}
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
                showAdvancedSearch 
                  ? 'bg-accent-50 border-accent-300 text-accent-700' 
                  : 'bg-white border-primary-300 text-primary-700 hover:bg-primary-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Advanced
              {showAdvancedSearch ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Advanced Search Panel */}
          {showAdvancedSearch && (
            <div className="mt-6 p-6 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-900">Advanced Search</h3>
                {hasActiveFilters() && (
                  <button
                    onClick={clearAdvancedFilters}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Date From</label>
                  <input
                    type="text"
                    placeholder="e.g., 1900"
                    value={advancedFilters.dateFrom}
                    onChange={(e) => handleAdvancedFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Date To</label>
                  <input
                    type="text"
                    placeholder="e.g., 1950"
                    value={advancedFilters.dateTo}
                    onChange={(e) => handleAdvancedFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Language</label>
                  <select
                    value={advancedFilters.language}
                    onChange={(e) => handleAdvancedFilterChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  >
                    <option value="">All Languages</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Collection Type */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Collection Type</label>
                  <select
                    value={advancedFilters.collectionType}
                    onChange={(e) => handleAdvancedFilterChange('collectionType', e.target.value)}
                    className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  >
                    <option value="">All Types</option>
                    {collectionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Has Images */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Has Images</label>
                  <select
                    value={advancedFilters.hasImages}
                    onChange={(e) => handleAdvancedFilterChange('hasImages', e.target.value)}
                    className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  >
                    <option value="">All Collections</option>
                    <option value="yes">With Images</option>
                    <option value="no">Without Images</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={advancedFilters.sortBy}
                      onChange={(e) => handleAdvancedFilterChange('sortBy', e.target.value)}
                      className="flex-1 px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAdvancedFilterChange('sortOrder', 
                        advancedFilters.sortOrder === 'asc' ? 'desc' : 'asc'
                      )}
                      className="px-3 py-2 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                      title={`Sort ${advancedFilters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      {advancedFilters.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredArchiveCollections.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-900 mb-2">No collections found</h3>
            <p className="text-primary-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-primary-200 rounded-2xl shadow-sm mb-10 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {TAB_CONFIG.map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-6 py-4 text-left border-b lg:border-b-0 lg:border-r border-primary-100 last:border-0 transition-colors duration-200 ${
                        isActive ? 'bg-blue-50' : 'bg-white hover:bg-primary-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-primary-500'}`}>
                            {tab.label}
                          </p>
                          <p className="text-xs text-primary-400">
                            {tabCounts[tab.id] || 0} collections
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            isActive ? 'bg-blue-600 text-white' : 'bg-primary-100 text-primary-500'
                          }`}
                        >
                          {tabCounts[tab.id] || 0}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {(() => {
              const activeConfig = TAB_CONFIG.find((tab) => tab.id === activeTab) || TAB_CONFIG[0]
              const tabItems = categorizedCollections[activeConfig.id] || []
              return renderCategorySection(activeConfig.label, activeConfig.description, tabItems)
            })()}
          </>
        )}
      </div>

    </div>
  )
}

export default Collections

