import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { archiveService } from '../services/api'

const ArchiveCollections = () => {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 12

  useEffect(() => {
    fetchCollections()
  }, [currentPage, sortBy, sortOrder])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        title_search: searchTerm || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      }
      console.log('Fetching collections with params:', params)
      const result = await archiveService.getAllCollections(params)
      console.log('Received collections data:', result)
      
      const collectionsData = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : []
      const totalCount = Number.isFinite(result?.total) ? result.total : collectionsData.length
      
      console.log('Number of collections:', collectionsData.length)
      console.log('Total collections:', totalCount)
      
      if (Array.isArray(collectionsData)) {
        setCollections(collectionsData)
        setTotalCount(totalCount)
        // Calculate total pages based on total count
        setTotalPages(Math.ceil(totalCount / itemsPerPage))
      } else {
        console.error('Expected array but got:', typeof collectionsData, collectionsData)
        setCollections([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (err) {
      setError('Failed to fetch collections')
      console.error('Error fetching collections:', err)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCollections()
  }

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
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
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">{error}</div>
            <button 
              onClick={fetchCollections}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
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
            Archive Collections
          </h1>
          <p className="text-gray-600 text-lg">
            Explore our comprehensive collection of historical photographs and archival materials
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="title">Title</option>
                <option value="date">Date</option>
                <option value="created">Created</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {collection.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">ID:</span> {collection.unit_id}
                  </p>
                  {collection.date_inclusive && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Date:</span> {formatDate(collection.date_inclusive)}
                    </p>
                  )}
                </div>

                {collection.abstract && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {collection.abstract}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {collection.extent && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Extent:</span> {collection.extent}
                    </p>
                  )}
                  {collection.languages && collection.languages.length > 0 && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Languages:</span> {getLanguageText(collection.languages)}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Link
                    to={`/archive/collections/${collection.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View Details →
                  </Link>
                  {collection.series && collection.series.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {collection.series.length} series
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Improved Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </button>
              
              {/* Show page numbers with ellipsis for large page counts */}
              {totalPages <= 7 ? (
                // Show all pages if 7 or fewer
                [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
              ) : (
                // Show first, last, current, and neighbors
                <>
                  {currentPage > 2 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        1
                      </button>
                      {currentPage > 3 && <span className="px-2 text-gray-400">...</span>}
                    </>
                  )}
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </>
              )}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} collections
            </div>
          </div>
        )}

        {/* Empty State */}
        {collections.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No collections found</div>
            <p className="text-gray-400">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArchiveCollections
