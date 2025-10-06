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
    <div className="bg-primary-50">
      <section className="relative overflow-hidden bg-primary-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
          <p className="text-sm uppercase tracking-[0.35em] text-accent-200 font-semibold">Contact Akkasah</p>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">We would love to hear from you</h1>
          <p className="mt-6 text-lg text-primary-100 max-w-3xl">
            Whether you are conducting research, planning a visit, or interested in collaboration, the Akkasah team is here to help.
            Reach out using the details below or send us a message through the form.
          </p>
        </div>
      </section>

      <section className="relative pb-20">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary-900/90 to-transparent" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 lg:-mt-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-primary-100/80 p-8 sm:p-10 flex flex-col">
              <div>
                <h2 className="text-2xl font-semibold text-primary-900">Visit or call</h2>
                <p className="mt-4 text-base text-primary-600 leading-relaxed">
                  Connect with the archive team through the channel that works best for you. We respond to most messages within two
                  business days.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {contactChannels.map((channel) => (
                  <a
                    key={channel.title}
                    href={channel.link}
                    className="flex items-start gap-4 rounded-2xl border border-primary-100/70 bg-primary-50/60 px-5 py-4 transition-all duration-200 hover:border-accent-200 hover:bg-white hover:shadow-lg"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent-600 shadow-sm">
                      <channel.icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-lg font-semibold text-primary-900">{channel.title}</span>
                      <span className="mt-1 block text-sm text-primary-600 leading-snug">{channel.description}</span>
                      <span className="mt-2 inline-flex items-center text-sm font-medium text-accent-600">
                        {channel.actionLabel}
                      </span>
                    </span>
                  </a>
                ))}
              </div>

              <div className="mt-10 rounded-2xl bg-primary-50/80 p-6">
                <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-accent-600 shadow-sm">
                    <Clock className="h-5 w-5" />
                  </span>
                  <span>Office hours</span>
                </h3>
                <dl className="mt-5 space-y-3 text-sm text-primary-600">
                  {officeHours.map((entry) => (
                    <div key={entry.day} className="flex items-center justify-between rounded-lg bg-white px-4 py-2 shadow-sm">
                      <dt className="font-medium text-primary-800">{entry.day}</dt>
                      <dd>{entry.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-primary-100/80 p-8 sm:p-10">
              <h2 className="text-2xl font-semibold text-primary-900 flex items-center">
                <MessageCircle className="h-6 w-6 text-accent-600 mr-3" />
                Send us a message
              </h2>
              <p className="mt-3 text-primary-600 leading-relaxed">
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
                      className="mt-2 block w-full rounded-xl border border-primary-200 bg-white px-4 py-3 text-primary-900 shadow-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-primary-700">Email address</span>
                    <input
                      type="email"
                      name="email"
                      required
                      className="mt-2 block w-full rounded-xl border border-primary-200 bg-white px-4 py-3 text-primary-900 shadow-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-primary-700">Enquiry type</span>
                  <select
                    name="topic"
                    required
                    className="mt-2 block w-full rounded-xl border border-primary-200 bg-white px-4 py-3 text-primary-900 shadow-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
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
                    className="mt-2 block w-full rounded-xl border border-primary-200 bg-white px-4 py-3 text-primary-900 shadow-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                    placeholder="Tell us more about how we can help"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-transparent bg-accent-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-accent-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                >
                  Submit message
                </button>

                {formStatus.type === 'success' && (
                  <p className="rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
                    {formStatus.message}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 sm:mt-10 lg:mt-16">
        <FAQSection
          faqs={faqs}
          description="Answers to common questions about connecting with the Akkasah archive."
          showContactCta
        />
      </div>
    </div>
  )
}

export default Contact

