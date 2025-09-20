import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Camera, Calendar, Archive, Download, Share2 } from 'lucide-react'
import { collectionService } from '../services/api'

const CollectionDetail = () => {
  const { id } = useParams()
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchCollection()
  }, [id])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      const data = await collectionService.getCollectionById(id)
      setCollection(data)
    } catch (error) {
      console.error('Error fetching collection:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto"></div>
            <p className="mt-4 text-primary-600">Loading collection...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-primary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-900 mb-4">Collection not found</h1>
            <Link to="/collections" className="btn-primary">
              Back to Collections
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            to="/collections" 
            className="inline-flex items-center text-accent-600 hover:text-accent-700 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Link>
          
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium text-accent-600 bg-accent-50 px-3 py-1 rounded-full">
                  {collection.type}
                </span>
                <span className="text-sm text-primary-500">{collection.period}</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
                {collection.title}
              </h1>
              
              <p className="text-lg text-primary-600 mb-6 leading-relaxed">
                {collection.description}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-primary-600">
                  <Camera className="h-4 w-4 mr-2" />
                  <span>{collection.imageCount} images</span>
                </div>
                <div className="flex items-center text-primary-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{collection.period}</span>
                </div>
                <div className="flex items-center text-primary-600">
                  <Archive className="h-4 w-4 mr-2" />
                  <span>{collection.collectionType}</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="btn-primary inline-flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Download Collection
                </button>
                <button className="btn-secondary inline-flex items-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
              </div>
            </div>
            
            <div className="lg:w-96">
              <div className="aspect-w-16 aspect-h-12 bg-primary-200 rounded-xl">
                <div className="flex items-center justify-center bg-gradient-to-br from-primary-300 to-primary-400 rounded-xl">
                  <Camera className="h-24 w-24 text-primary-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">Collection Details</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">Historical Context</h3>
                <p className="text-primary-600 leading-relaxed">
                  {collection.historicalContext || "This collection represents an important period in the photographic history of the region, showcasing the evolution of photographic techniques and cultural documentation practices."}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">Collection Highlights</h3>
                <ul className="list-disc list-inside text-primary-600 space-y-1">
                  <li>Rare early photographic techniques and processes</li>
                  <li>Documentation of significant historical events</li>
                  <li>Portraits of notable figures from the period</li>
                  <li>Landscape and architectural photography</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">Preservation Notes</h3>
                <p className="text-primary-600 leading-relaxed">
                  All images in this collection have been professionally digitized and are stored in our climate-controlled archive. 
                  Original materials are preserved according to international conservation standards.
                </p>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Collection Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-primary-700">Collection ID:</span>
                  <p className="text-primary-600">{collection.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-primary-700">Date Range:</span>
                  <p className="text-primary-600">{collection.period}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-primary-700">Total Images:</span>
                  <p className="text-primary-600">{collection.imageCount}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-primary-700">Collection Type:</span>
                  <p className="text-primary-600">{collection.type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-primary-700">Last Updated:</span>
                  <p className="text-primary-600">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Access Information</h3>
              <p className="text-sm text-primary-600 mb-4">
                This collection is available for research and educational purposes. 
                High-resolution images can be requested for academic use.
              </p>
              <button className="w-full btn-primary">
                Request Access
              </button>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Related Collections</h3>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-accent-600 hover:text-accent-700">
                  Early Photography in the Holy Lands
                </a>
                <a href="#" className="block text-sm text-accent-600 hover:text-accent-700">
                  Ottoman Empire Portraits
                </a>
                <a href="#" className="block text-sm text-accent-600 hover:text-accent-700">
                  Family Albums Collection
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollectionDetail
