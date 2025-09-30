import React from 'react'
import { Link } from 'react-router-dom'
import { Camera, Mail, MapPin, Phone } from 'lucide-react'

const quickLinks = [
  { name: 'Collections', to: '/collections' },
  { name: 'About', to: '/about' },
  { name: 'Search', to: '/search' },
  { name: 'FAQ', to: '/faq' },
  { name: 'Contact', to: '/contact' },
]

const Footer = () => {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="h-8 w-8 text-accent-400" />
              <span className="text-xl font-bold">Akkasah</span>
            </div>
            <p className="text-primary-300 mb-4 max-w-md">
              The Photography Archive at New York University Abu Dhabi, dedicated to documenting 
              and preserving the diverse histories and practices of photography from the Middle East and North Africa.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-300 hover:text-accent-400 transition-colors duration-200">
                <Mail className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-300 hover:text-accent-400 transition-colors duration-200">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-primary-300 hover:text-accent-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-primary-300">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-sm">
                  P.O. BOX 129188<br />
                  ABU DHABI, UAE
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">971 2 628 5531</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">akkasah@nyu.edu</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-400 text-sm">
              © 2024 Akkasah Center for Photography. All rights reserved.
            </p>
            <p className="text-primary-400 text-sm mt-2 md:mt-0">
              Part of <em>al Mawrid</em>, the Arab Center for the Study of Art
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
