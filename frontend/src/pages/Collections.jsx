import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Camera, Calendar, ArrowRight } from 'lucide-react'
import { collectionService } from '../services/api'

const Collections = () => {
  const [collections, setCollections] = useState([])
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
      const data = await collectionService.getAllCollections()
      setCollections(data)
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPeriod = !selectedPeriod || collection.period === selectedPeriod
    const matchesType = !selectedType || collection.type === selectedType
    return matchesSearch && matchesPeriod && matchesType
  })

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
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-900 mb-2">No collections found</h3>
            <p className="text-primary-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCollections.map((collection) => (
              <div key={collection.id} className="card group hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-w-16 aspect-h-12 bg-primary-200 rounded-t-xl">
                  <div className="flex items-center justify-center bg-gradient-to-br from-primary-300 to-primary-400">
                    <Camera className="h-16 w-16 text-primary-600" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-accent-600">{collection.period}</span>
                    <span className="text-sm text-primary-500">{collection.imageCount} images</span>
                  </div>
                  <h3 className="text-xl font-semibold text-primary-900 mb-3 group-hover:text-accent-600 transition-colors duration-200">
                    {collection.title}
                  </h3>
                  <p className="text-primary-600 mb-4 line-clamp-3">
                    {collection.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary-500 bg-primary-100 px-2 py-1 rounded">
                      {collection.type}
                    </span>
                    <Link 
                      to={`/collections/${collection.id}`}
                      className="inline-flex items-center text-accent-600 hover:text-accent-700 font-medium"
                    >
                      View Collection
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Collections
