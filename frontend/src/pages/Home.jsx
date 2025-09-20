import React from 'react'
import { Link } from 'react-router-dom'
import { Search, Archive, BookOpen, Camera, ArrowRight } from 'lucide-react'
import HeroCarousel from '../components/HeroCarousel'
import historicalCollectionsImage from '../assets/historical_collections.jpg'

const Home = () => {
  const featuredCollections = [
    {
      id: 1,
      title: "Early Photography in the Holy Lands",
      description: "A collection of 19th-century photographs documenting the Holy Lands",
      imageCount: 1250,
      period: "1850-1900"
    },
    {
      id: 2,
      title: "Ottoman Empire Portraits",
      description: "Studio portraits and family photographs from the Ottoman period",
      imageCount: 890,
      period: "1870-1920"
    },
    {
      id: 3,
      title: "Egyptian Cinema Archive",
      description: "Behind-the-scenes photographs from the golden age of Egyptian cinema",
      imageCount: 2100,
      period: "1940-1970"
    }
  ]

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCollections.map((collection) => (
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
                  <Link 
                    to={`/collections/${collection.id}`}
                    className="inline-flex items-center text-accent-600 hover:text-accent-700 font-medium"
                  >
                    View Collection
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

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
