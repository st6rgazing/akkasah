import React, { useState } from 'react'
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'
import FAQSection from '../components/FAQSection'

const contactChannels = [
  {
    title: 'General enquiries',
    description: 'Questions about the archive, programming, or using the collections.',
    icon: Mail,
    link: 'mailto:akkasah@nyu.edu',
    actionLabel: 'akkasah@nyu.edu',
  },
  {
    title: 'Call the team',
    description: 'Speak with a member of the Akkasah staff during office hours.',
    icon: Phone,
    link: 'tel:+97126285531',
    actionLabel: '+971 2 628 5531',
  },
  {
    title: 'Visit the archive',
    description: 'Schedule an appointment to consult materials in person.',
    icon: MapPin,
    link: 'https://maps.app.goo.gl/jvZwYw7Yq1Bk6T4L8',
    actionLabel: 'NYU Abu Dhabi, Saadiyat Island',
  },
]

const faqs = [
  {
    question: 'How can I request access to specific photographs or collections?',
    answer:
      'Submit an enquiry with details about the material you are looking for. Our archivists will review the request and contact you with the next steps within two business days.',
  },
  {
    question: 'Do I need to make an appointment before visiting the archive?',
    answer:
      'Yes. Appointments ensure that a member of the team is available to prepare material in advance. Use the form below to tell us more about your visit and we will confirm availability.',
  },
  {
    question: 'Who should I contact about collaboration or programming opportunities?',
    answer:
      'For partnerships, exhibitions, or educational programming please select “Partnership enquiry” in the form. The relevant team member will reach out with more information.',
  },
]

const officeHours = [
  { day: 'Sunday — Thursday', time: '9:00 – 17:00 Gulf Standard Time' },
  { day: 'Friday — Saturday', time: 'Closed' },
]

const Contact = () => {
  const [formStatus, setFormStatus] = useState({ type: 'idle', message: '' })

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')

    setFormStatus({
      type: 'success',
      message: `Thank you, ${name || 'friend'}! We have received your message and will respond shortly.`,
    })
    event.currentTarget.reset()
  }

  return (
    <div className="bg-white">
      <section className="bg-primary-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm uppercase tracking-widest text-accent-300 font-semibold">Contact Akkasah</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold">We would love to hear from you</h1>
          <p className="mt-6 text-lg text-primary-200 max-w-3xl">
            Whether you are conducting research, planning a visit, or interested in collaboration, the Akkasah team is here to
            help. Reach out using the details below or send us a message through the form.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl border border-primary-100 p-8">
            <h2 className="text-2xl font-semibold text-primary-900">Visit or call</h2>
            <p className="mt-3 text-primary-600">
              Connect with the archive team through the channel that works best for you. We respond to most messages within two
              business days.
            </p>

            <div className="mt-8 space-y-6">
              {contactChannels.map((channel) => (
                <a
                  key={channel.title}
                  href={channel.link}
                  className="flex items-start space-x-4 group"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-accent-600 group-hover:bg-accent-50 group-hover:text-accent-700 transition-colors duration-200">
                    <channel.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-primary-900">{channel.title}</span>
                    <span className="mt-1 block text-sm text-primary-600">{channel.description}</span>
                    <span className="mt-2 inline-flex items-center text-sm font-medium text-accent-600 group-hover:text-accent-700">
                      {channel.actionLabel}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-primary-100">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-accent-600" />
                <span>Office hours</span>
              </h3>
              <dl className="mt-4 space-y-2">
                {officeHours.map((entry) => (
                  <div key={entry.day} className="flex justify-between text-sm text-primary-600">
                    <dt className="font-medium text-primary-700">{entry.day}</dt>
                    <dd>{entry.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-primary-100 p-8">
            <h2 className="text-2xl font-semibold text-primary-900 flex items-center">
              <MessageCircle className="h-6 w-6 text-accent-600 mr-3" />
              Send us a message
            </h2>
            <p className="mt-3 text-primary-600">
              Complete the form and share as much detail as possible. We will review your message and follow up with next steps.
            </p>

            <form className="mt-8 grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-sm font-medium text-primary-700">Full name</span>
                  <input
                    type="text"
                    name="name"
                    required
                    className="mt-2 block w-full rounded-lg border border-primary-200 bg-white px-4 py-3 text-primary-900 shadow-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                    placeholder="Your name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-primary-700">Email address</span>
                  <input
                    type="email"
                    name="email"
                    required
                    className="mt-2 block w-full rounded-lg border border-primary-200 bg-white px-4 py-3 text-primary-900 shadow-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-primary-700">Enquiry type</span>
                <select
                  name="topic"
                  required
                  className="mt-2 block w-full rounded-lg border border-primary-200 bg-white px-4 py-3 text-primary-900 shadow-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select an option
                  </option>
                  <option value="research">Research enquiry</option>
                  <option value="visit">Plan a visit</option>
                  <option value="partnership">Partnership enquiry</option>
                  <option value="licensing">Image licensing</option>
                  <option value="other">Something else</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-primary-700">Message</span>
                <textarea
                  name="message"
                  rows="5"
                  required
                  className="mt-2 block w-full rounded-lg border border-primary-200 bg-white px-4 py-3 text-primary-900 shadow-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                  placeholder="Tell us more about how we can help"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-accent-600 px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-accent-700"
              >
                Submit message
              </button>

              {formStatus.type === 'success' && (
                <p className="rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-700">
                  {formStatus.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      <FAQSection faqs={faqs} description="Answers to common questions about connecting with the Akkasah archive." showContactCta />
    </div>
  )
}

export default Contact

