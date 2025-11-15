import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Archive, BookOpen, Camera, ArrowRight } from 'lucide-react'
import HeroCarousel from '../components/HeroCarousel'
import historicalCollectionsImage from '../assets/historical_collections.jpg'
import { archiveService } from '../services/api'
import { COLLECTION_IMAGE_MAP } from '../constants/collectionImages'

const FEATURED_COLLECTION_IDS = ['AD.MC.012', 'AD.MC.036', 'AD.MC.028']

const Home = () => {
  const [archiveCollections, setArchiveCollections] = useState([])
  const [featuredCollections, setFeaturedCollections] = useState([])
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [featuredError, setFeaturedError] = useState(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setFeaturedLoading(true)
        const archiveData = await archiveService.getAllCollections()
        const collectionsData = Array.isArray(archiveData?.data)
          ? archiveData.data
          : Array.isArray(archiveData)
            ? archiveData
            : []
        setArchiveCollections(collectionsData)

        const normalizedMap = new Map()
        collectionsData.forEach((collection) => {
          if (!collection?.unit_id) return
          normalizedMap.set(collection.unit_id.trim(), collection)
          normalizedMap.set(collection.unit_id.replace(/_/g, '.').trim(), collection)
        })

        const curated = FEATURED_COLLECTION_IDS.map((unitId) => normalizedMap.get(unitId)).filter(Boolean)
        setFeaturedCollections(curated)
        setFeaturedError(null)
      } catch (error) {
        console.error('Failed to load featured collections:', error)
        setFeaturedError('Unable to load featured collections right now.')
      } finally {
        setFeaturedLoading(false)
      }
    }

    fetchCollections()
  }, [])

  const getFallbackImage = (unitId) =>
    (unitId && COLLECTION_IMAGE_MAP[unitId]) || COLLECTION_IMAGE_MAP.fallback || null

  const resolveObjectImage = (obj) => {
    if (!obj || typeof obj !== 'object') return null
    const candidates = [
      obj.resolved_full_image,
      obj.resolved_thumbnail,
      obj.full_image,
      obj.thumbnail,
      obj.href
    ]
    return candidates.find((url) => typeof url === 'string' && url && !url.includes('hdl.handle.net')) || null
  }

  const getCollectionImage = (collection) => {
    const pickFromObjects = (objects = []) => {
      if (!Array.isArray(objects)) return null
      for (const obj of objects) {
        const resolved = resolveObjectImage(obj)
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

  const getImageCount = (collection) => {
    if (!collection) return 0
    let count = Array.isArray(collection.digital_objects) ? collection.digital_objects.length : 0
    if (Array.isArray(collection.files)) {
      for (const file of collection.files) {
        count += Array.isArray(file.digital_objects) ? file.digital_objects.length : 0
      }
    }
    return count
  }

  const preparedFeaturedCollections = useMemo(
    () =>
      featuredCollections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        description: collection.abstract || collection.scope_content || 'Archive collection',
        period: collection.date_inclusive || 'Dates unavailable',
        unitId: collection.unit_id,
        imageCount: getImageCount(collection),
        image: getCollectionImage(collection)
      })),
    [featuredCollections]
  )

  const stats = [
    { number: "33,000+", label: "Images in Archive" },
    { number: "150+", label: "Collections" },
    { number: "25+", label: "Countries Represented" },
    { number: "19th-21st", label: "Centuries Covered" }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Historical Collections Section */}
      <section className="py-20 bg-gradient-to-r from-primary-50 to-accent-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Historical Collections
            </h2>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              Explore our extensive historical photography collections from the 19th and 20th centuries
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src={historicalCollectionsImage} 
                alt="Historical Collections" 
                className="w-full h-80 object-cover rounded-xl shadow-lg"
              />
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  to="/collections?type=Historical&period=1850-1900"
                  className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-primary-200 hover:border-primary-300"
                >
                  <div className="flex items-center mb-3">
                    <Camera className="h-6 w-6 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-600">
                      19th Century Photography
                    </h3>
                  </div>
                  <p className="text-primary-600 text-sm">
                    Early photography from the Holy Lands and Ottoman Empire
                  </p>
                </Link>

                <Link 
                  to="/collections?type=Historical&period=1900-1950"
                  className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-primary-200 hover:border-primary-300"
                >
                  <div className="flex items-center mb-3">
                    <Archive className="h-6 w-6 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-600">
                      Early 20th Century
                    </h3>
                  </div>
                  <p className="text-primary-600 text-sm">
                    Studio portraits and family photographs from the region
                  </p>
                </Link>

                <Link 
                  to="/collections?type=Photo Albums"
                  className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-primary-200 hover:border-primary-300"
                >
                  <div className="flex items-center mb-3">
                    <BookOpen className="h-6 w-6 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-600">
                      Family Archives
                    </h3>
                  </div>
                  <p className="text-primary-600 text-sm">
                    Digitized family photographic albums and personal collections
                  </p>
                </Link>

                <Link 
                  to="/collections?type=Contemporary"
                  className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-primary-200 hover:border-primary-300"
                >
                  <div className="flex items-center mb-3">
                    <Camera className="h-6 w-6 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-600">
                      Contemporary Works
                    </h3>
                  </div>
                  <p className="text-primary-600 text-sm">
                    Modern documentary photography and artistic projects
                  </p>
                </Link>
              </div>

              <div className="pt-4">
                <Link 
                  to="/collections" 
                  className="btn-primary text-lg px-8 py-3 inline-flex items-center"
                >
                  Explore All Collections
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Archive Collections Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-900 mb-4">
              Archive Collections
            </h2>
            <p className="text-lg text-primary-600 max-w-2xl mx-auto">
              Discover our comprehensive archive of historical photographs and archival materials from across the Middle East and North Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center">
                <Archive className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary-900 mb-4">
                  Browse Archive
                </h3>
                <p className="text-primary-600 mb-6">
                  Explore our extensive collection of archival materials with detailed metadata and descriptions.
                </p>
                <Link
                  to="/archive/collections"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Browse Collections
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center">
                <Search className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary-900 mb-4">
                  Advanced Search
                </h3>
                <p className="text-primary-600 mb-6">
                  Use our powerful search tools to find specific collections, series, and files with advanced filtering.
                </p>
                <Link
                  to="/archive/search"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Advanced Search
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary-900 mb-4">
                  Research Tools
                </h3>
                <p className="text-primary-600 mb-6">
                  Access detailed finding aids, metadata, and research tools for academic and professional use.
                </p>
                <Link
                  to="/about"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Featured Collections
            </h2>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              Discover our carefully curated collections spanning from the 19th century to contemporary works
            </p>
          </div>

          {featuredLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto mb-4"></div>
              <p className="text-primary-600">Loading featured collections…</p>
            </div>
          ) : featuredError ? (
            <div className="text-center py-12 text-primary-600">
              {featuredError}
            </div>
          ) : preparedFeaturedCollections.length === 0 ? (
            <div className="text-center py-12 text-primary-600">
              No featured collections available right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {preparedFeaturedCollections.map((collection) => (
                <div key={collection.id} className="card group hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <div className="relative h-56 bg-primary-200 rounded-t-xl overflow-hidden">
                    {collection.image ? (
                      <img
                        src={collection.image}
                        alt={collection.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-100 to-primary-200">
                        <Camera className="h-12 w-12 text-primary-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-accent-600">{collection.period}</span>
                      <span className="text-sm text-primary-500">
                        {collection.imageCount || '—'} images
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-primary-900 mb-3 group-hover:text-accent-600 transition-colors duration-200">
                      {collection.title}
                    </h3>
                    <p className="text-primary-600 mb-4 line-clamp-3 flex-1">
                      {collection.description}
                    </p>
                    <Link 
                      to={collection.id ? `/archive/collections/${collection.id}` : '/collections'}
                      className="inline-flex items-center text-accent-600 hover:text-accent-700 font-medium mt-auto"
                    >
                      View Collection
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link 
              to="/collections" 
              className="btn-primary text-lg px-8 py-3 inline-flex items-center"
            >
              View All Collections
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-6">
                About Akkasah
              </h2>
              <p className="text-lg text-primary-600 mb-6">
                Part of <em>al Mawrid, the Arab Center for the Study of Art</em>, Akkasah is dedicated 
                to documenting and preserving the diverse histories and practices of photography from 
                the Middle East and North Africa.
              </p>
              <p className="text-lg text-primary-600 mb-8">
                Our growing archive contains over 33,000 images and supports research through conferences, 
                colloquia, publications, and our research fellowship program.
              </p>
              <Link 
                to="/about" 
                className="btn-primary text-lg px-8 py-3 inline-flex items-center"
              >
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-accent-50 p-6 rounded-xl">
                  <Archive className="h-8 w-8 text-accent-600 mb-3" />
                  <h3 className="font-semibold text-primary-900 mb-2">Historical Collections</h3>
                  <p className="text-sm text-primary-600">19th century to late 20th century</p>
                </div>
                <div className="bg-primary-50 p-6 rounded-xl">
                  <BookOpen className="h-8 w-8 text-primary-600 mb-3" />
                  <h3 className="font-semibold text-primary-900 mb-2">Photo Albums</h3>
                  <p className="text-sm text-primary-600">Digitized photographic albums</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-primary-50 p-6 rounded-xl">
                  <Camera className="h-8 w-8 text-primary-600 mb-3" />
                  <h3 className="font-semibold text-primary-900 mb-2">Contemporary Projects</h3>
                  <p className="text-sm text-primary-600">New documentary photography</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
