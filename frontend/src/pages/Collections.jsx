import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Camera, Calendar, ArrowRight, Archive } from 'lucide-react'
import { collectionService, archiveService } from '../services/api'

const Collections = () => {
  const [archiveCollections, setArchiveCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedType, setSelectedType] = useState('')

  const periods = ['1850-1900', '1900-1950', '1950-2000', '2000-Present']
  const types = ['Historical', 'Contemporary', 'Photo Albums', 'Family Archives']

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      console.log('Starting to fetch collections...')
      const archiveData = await archiveService.getAllCollections()
      console.log('Fetched archive data:', archiveData)
      console.log('Number of collections:', archiveData?.length || 0)
      console.log('Type of archiveData:', typeof archiveData)
      console.log('Is array?', Array.isArray(archiveData))
      setArchiveCollections(archiveData || [])
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArchiveCollections = (archiveCollections || []).filter(collection => {
    const matchesSearch = collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (collection.abstract && collection.abstract.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  console.log('Archive collections state:', archiveCollections)
  console.log('Filtered collections:', filteredArchiveCollections)

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
    
    return allImages
  }



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
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredArchiveCollections.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-900 mb-2">No collections found</h3>
            <p className="text-primary-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArchiveCollections.map((collection) => {
              const collectionImage = getCollectionImage(collection)
              
              return (
                <div key={collection.id} className="card group hover:shadow-lg transition-shadow duration-300">
                  <Link 
                    to={`/archive/collections/${collection.id}`}
                    className="block"
                  >
                    <div className="aspect-w-16 aspect-h-12 bg-primary-200 rounded-t-xl overflow-hidden">
                      {collectionImage ? (
                        <img 
                          src={`https://images.weserv.nl/?url=${encodeURIComponent(collectionImage)}&w=250&h=180&fit=cover&q=95&f=webp`}
                          alt={collection.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="eager"
                          decoding="async"
                          onError={(e) => {
                            // Try direct URL as fallback
                            e.target.src = collectionImage
                            e.target.onError = (e2) => {
                              e2.target.style.display = 'none'
                              e2.target.nextSibling.style.display = 'flex'
                            }
                          }}
                          onLoad={(e) => {
                            e.target.nextSibling.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-300 to-blue-400 ${collectionImage ? 'hidden' : 'flex'}`}>
                        <Archive className="h-16 w-16 text-blue-600" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">{formatDate(collection.date_inclusive)}</span>
                        <span className="text-sm text-primary-500">{collection.unit_id}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-primary-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                        {collection.title}
                      </h3>
                      <p className="text-primary-600 mb-4 line-clamp-3">
                        {collection.abstract || 'Archive collection'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <span className="text-sm text-primary-500 bg-blue-100 px-2 py-1 rounded">
                            Archive
                          </span>
                        </div>
                        <div className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                          View Details
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  {collection.file_path && (
                    <div className="px-6 pb-6">
                      <a 
                        href={`file://${collection.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Finding Aid
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

export default Collections
