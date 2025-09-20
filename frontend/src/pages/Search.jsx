import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Filter, Camera, Calendar, ArrowRight } from 'lucide-react'
import { searchService } from '../services/api'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    collection: '',
    period: '',
    type: ''
  })

  const periods = ['1850-1900', '1900-1950', '1950-2000', '2000-Present']
  const types = ['Historical', 'Contemporary', 'Photo Albums', 'Family Archives']

  useEffect(() => {
    if (query) {
      performSearch()
    }
  }, [query, filters])

  const performSearch = async () => {
    if (!query.trim()) return

    try {
      setLoading(true)
      const data = await searchService.search({
        query,
        ...filters
      })
      setResults(data)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams({ q: query })
    performSearch()
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            Search Archive
          </h1>
          <p className="text-xl text-primary-600 max-w-3xl">
            Search through our extensive collection of photographs and metadata
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-400" />
                  <input
                    type="text"
                    placeholder="Search for photographs, collections, or metadata..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none text-lg"
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="btn-primary text-lg px-8 py-3"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Collection
                </label>
                <select
                  value={filters.collection}
                  onChange={(e) => handleFilterChange('collection', e.target.value)}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                >
                  <option value="">All Collections</option>
                  <option value="historical">Historical Collections</option>
                  <option value="contemporary">Contemporary Projects</option>
                  <option value="albums">Photo Albums</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Period
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                >
                  <option value="">All Periods</option>
                  {periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                >
                  <option value="">All Types</option>
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto"></div>
            <p className="mt-4 text-primary-600">Searching...</p>
          </div>
        ) : results.length === 0 && query ? (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-900 mb-2">No results found</h3>
            <p className="text-primary-600">Try adjusting your search terms or filters</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-primary-900">
                Search Results ({results.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => (
                <div key={result.id} className="card group hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-w-16 aspect-h-12 bg-primary-200 rounded-t-xl">
                    <div className="flex items-center justify-center bg-gradient-to-br from-primary-300 to-primary-400">
                      <Camera className="h-16 w-16 text-primary-600" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-accent-600">{result.period}</span>
                      <span className="text-sm text-primary-500">{result.collection}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors duration-200">
                      {result.title}
                    </h3>
                    <p className="text-primary-600 mb-4 text-sm line-clamp-3">
                      {result.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary-500 bg-primary-100 px-2 py-1 rounded">
                        {result.type}
                      </span>
                      <button className="inline-flex items-center text-accent-600 hover:text-accent-700 font-medium text-sm">
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-900 mb-2">Start your search</h3>
            <p className="text-primary-600">Enter a search term to explore our archive</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
