import React from 'react'
import { Camera, Archive, BookOpen, Users } from 'lucide-react'
import shamoonImage from '../assets/shamoon.jpg'
import jonathanImage from '../assets/jonathan.jpg'
import ibrahimImage from '../assets/ibrahim.jpg'

const About = () => {
  const features = [
    {
      icon: <Archive className="h-8 w-8 text-accent-600" />,
      title: "Historical Collections",
      description: "Our historical collections range from the nineteenth century to the late twentieth, covering themes from early images of the Holy Lands to family albums and institutional archives."
    },
    {
      icon: <BookOpen className="h-8 w-8 text-accent-600" />,
      title: "Photo Albums",
      description: "Akkasah's collection of photographic albums from the region has been created in collaboration with the Library at NYUAD, housed in Special Collections."
    },
    {
      icon: <Camera className="h-8 w-8 text-accent-600" />,
      title: "Contemporary Projects",
      description: "We commission and support documentary photographic projects focused on the Middle East and North Africa, creating exhibitions and archiving additional images."
    }
  ]

  const stats = [
    { number: "33,000+", label: "Images in Archive" },
    { number: "150+", label: "Collections" },
    { number: "25+", label: "Countries Represented" },
    { number: "19th-21st", label: "Centuries Covered" }
  ]

  const team = [
    {
      name: "Shamoon Zamir",
      role: "Director",
      image: shamoonImage,
      description: "Shamoon Zamir is an Associate Professor of Literature and Art History at NYU Abu Dhabi. His research spans literature, photography, art, and intellectual history. He is the author of Dark Voices on W.E.B. Du Bois and The Gift of the Face on Edward S. Curtis, and is currently completing Photography and Citizenship, a study of The Family of Man exhibition and its global reception. Zamir has also published on Helen Levitt and translated Urdu short stories. He previously taught at the University of Chicago, York University, and the University of London."
    },
    {
      name: "Jon Burr",
      role: "Digital Collections Management Archivist",
      image: jonathanImage,
      description: "Since 2016, Jon Burr has worked on a variety of collections at Akkasah, including the digitization of the Samir Farid collection, a collection of negatives created on the sets of Egyptian films from throughout the 20th century. His professional interests lie primarily in digitization and online access to digital research materials, especially endangered archives that have become inaccessible, overlooked, or are in immediate danger of physical deterioration. Jon holds a MLitt in Archives and Records Management from the University of Dundee."
    },
    {
      name: "Ibrahim Mohamed Ali",
      role: "Archivist",
      image: ibrahimImage,
      description: "Ibrahim Mohamed Ali is the Lead Archivist at al Mawrid, NYU Abu Dhabi, where he oversees the processing, cataloging, and preservation of the Arab Art Archive collections. His work focuses on developing cataloging frameworks for Arabic-language archives to enhance accessibility. Previously, he worked on major preservation projects, including the Ministry of Antiquities glass negative archives and the Attaya Gaddis studio archive, and served at the Grand Egyptian Museum Conservation Center. He holds an MA in Museum Studies from George Washington University and a BA in Conservation from Cairo University."}]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              About Akkasah
            </h1>
            <p className="text-xl md:text-2xl text-primary-200 mb-8 leading-relaxed">
              The Photography Archive at New York University Abu Dhabi, dedicated to documenting 
              and preserving the diverse histories and practices of photography from the Middle East and North Africa.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-primary-600 mb-6">
                Part of <em>al Mawrid, the Arab Center for the Study of Art</em>, Akkasah is dedicated 
                to documenting and preserving the diverse histories and practices of photography from 
                the Middle East and North Africa.
              </p>
              <p className="text-lg text-primary-600 mb-6">
                Our growing archive contains over 33,000 images and supports research through conferences, 
                colloquia, publications, and our research fellowship program of the NYUAD Institute.
              </p>
              <p className="text-lg text-primary-600">
                We also commission new documentary projects from contemporary photographers and are establishing 
                a special collection of photographic albums and original photobooks from around the world.
              </p>
            </div>
            <div className="bg-primary-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-semibold text-primary-900 mb-6">Key Statistics</h3>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-accent-600 mb-2">
                      {stat.number}
                    </div>
                    <div className="text-primary-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              What We Do
            </h2>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              Our comprehensive approach to preserving and sharing photographic heritage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-8 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-primary-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Our Team
            </h2>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              Dedicated professionals working to preserve and share photographic heritage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="card p-8 text-center">
                <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Users className="h-8 w-8 text-accent-600" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-accent-600 font-medium mb-4">
                  {member.role}
                </p>
                <p className="text-primary-600">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-primary-600 mb-8 max-w-3xl mx-auto">
              We welcome proposals for new collections and collaborations. 
              Both the archive and special collection are open to scholars, students and the general public by appointment.
            </p>
            <div className="bg-primary-50 p-8 rounded-2xl max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-primary-900 mb-4">Contact Information</h3>
              <div className="space-y-2 text-primary-600">
                <p><strong>Email:</strong> akkasah@nyu.edu</p>
                <p><strong>Phone:</strong> 971 2 628 5531</p>
                <p><strong>Address:</strong> P.O. BOX 129188, ABU DHABI, UAE</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
