import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive } from 'lucide-react'
import { archiveService } from '../services/api'

const AdvancedSearch = () => {
  const [searchParams, setSearchParams] = useState({
    q: '',
    search_type: 'all',
    date_from: '',
    date_to: '',
    language: '',
    sort_by: 'relevance',
    sort_order: 'asc'
  })
  const [results, setResults] = useState({ collections: [], series: [], files: [], total_results: 0 })
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const searchTypes = [
    { value: 'all', label: 'All' },
    { value: 'collections', label: 'Collections' },
    { value: 'series', label: 'Series' },
    { value: 'files', label: 'Files' }
  ]

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'title', label: 'Title' },
    { value: 'date', label: 'Date' },
    { value: 'created', label: 'Created Date' }
  ]

  const languages = [
    { value: '', label: 'All Languages' },
    { value: 'English', label: 'English' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Turkish', label: 'Turkish' }
  ]

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchParams.q.trim()) return

    setLoading(true)
    setHasSearched(true)
    
    try {
      const data = await archiveService.search(searchParams)
      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
      setResults({ collections: [], series: [], files: [], total_results: 0 })
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchParams({
      q: '',
      search_type: 'all',
      date_from: '',
      date_to: '',
      language: '',
      sort_by: 'relevance',
      sort_order: 'asc'
    })
    setResults({ collections: [], series: [], files: [], total_results: 0 })
    setHasSearched(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    return dateString
  }

  const getLanguageText = (languages) => {
    if (!languages || !Array.isArray(languages)) return 'Unknown'
    return languages.map(lang => lang.text || lang).join(', ')
  }

  const getCollectionImage = (item) => {
    if (item.digital_objects && item.digital_objects.length > 0) {
      // Prioritize thumbnail for fastest loading
      const firstImage = item.digital_objects.find(obj => 
        obj.role === 'image-thumbnail' && obj.href && obj.href.includes('hdl.handle.net')
      ) || item.digital_objects.find(obj => 
        obj.href && obj.href.includes('hdl.handle.net')
      )
      if (firstImage) {
        return firstImage.href
      }
    }
    return null
  }

  const renderResultItem = (item, type) => {
    const isCollection = type === 'collections'
    const isSeries = type === 'series'
    const isFile = type === 'files'

    return (
      <div key={item.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex space-x-4 mb-4">
          <div className="flex-shrink-0">
            {getCollectionImage(item) ? (
              <img 
                src={`https://images.weserv.nl/?url=${encodeURIComponent(getCollectionImage(item))}&w=120&h=80&fit=cover&q=95&f=webp`}
                alt={item.title || 'Untitled'}
                className="w-30 h-20 object-cover rounded-lg"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className={`w-30 h-20 flex items-center justify-center bg-gradient-to-br from-blue-300 to-blue-400 rounded-lg ${getCollectionImage(item) ? 'hidden' : 'flex'}`}>
              <Archive className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {item.title || 'Untitled'}
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {type.slice(0, -1).toUpperCase()}
              </span>
            </div>
            
            {item.unit_id && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">ID:</span> {item.unit_id}
              </p>
            )}

            {(item.date_inclusive || item.date_creation) && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Date:</span> {formatDate(item.date_inclusive || item.date_creation)}
              </p>
            )}
          </div>
        </div>

        {item.abstract && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {item.abstract}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {item.extent && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Extent:</span> {item.extent}
            </p>
          )}
          {item.languages && item.languages.length > 0 && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Languages:</span> {getLanguageText(item.languages)}
            </p>
          )}
          {item.dimensions && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Dimensions:</span> {item.dimensions}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {isCollection && (
              <Link
                to={`/archive/collections/${item.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View Collection →
              </Link>
            )}
            {isSeries && (
              <Link
                to={`/archive/series/${item.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View Series →
              </Link>
            )}
            {isFile && (
              <span className="text-sm text-gray-500">
                File ID: {item.unit_id}
              </span>
            )}
            {item.file_path && (
              <a 
                href={`file://${item.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Finding Aid
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Advanced Search
          </h1>
          <p className="text-gray-600 text-lg">
            Search across collections, series, and files with advanced filtering options
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Query */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query *
              </label>
              <input
                type="text"
                value={searchParams.q}
                onChange={(e) => handleInputChange('q', e.target.value)}
                placeholder="Enter search terms..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search In
                </label>
                <select
                  value={searchParams.search_type}
                  onChange={(e) => handleInputChange('search_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {searchTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={searchParams.date_from}
                  onChange={(e) => handleInputChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={searchParams.date_to}
                  onChange={(e) => handleInputChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={searchParams.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={searchParams.sort_by}
                  onChange={(e) => handleInputChange('sort_by', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <select
                  value={searchParams.sort_order}
                  onChange={(e) => handleInputChange('sort_order', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || !searchParams.q.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={clearSearch}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {hasSearched && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results
              </h2>
              <p className="text-gray-600">
                Found {results.total_results} results for &ldquo;{searchParams.q}&rdquo;
              </p>
            </div>

            {loading ? (
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Collections Results */}
                {results.collections.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Collections ({results.collections.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.collections.map(item => renderResultItem(item, 'collections'))}
                    </div>
                  </div>
                )}

                {/* Series Results */}
                {results.series.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Series ({results.series.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.series.map(item => renderResultItem(item, 'series'))}
                    </div>
                  </div>
                )}

                {/* Files Results */}
                {results.files.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Files ({results.files.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.files.map(item => renderResultItem(item, 'files'))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {results.total_results === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg mb-4">No results found</div>
                    <p className="text-gray-400">Try adjusting your search terms or filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearch
