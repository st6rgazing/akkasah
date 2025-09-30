import React from 'react'
import FAQSection from '../components/FAQSection'

const faqs = [
  {
    question: 'What is Akkasah and what does the archive contain?',
    answer: [
      'Akkasah is the Photography Archive at New York University Abu Dhabi. The archive documents photography across the Middle East, North Africa, and their diasporas, with collections that date from the mid-19th century to the present day.',
      'Materials include family albums, studio photography, institutional collections, and born-digital commissions that preserve contemporary photographic practices.',
    ],
  },
  {
    question: 'Can I access digitized materials remotely?',
    answer:
      'A growing selection of digitized photographs is available through the public catalogue. For material that has not yet been digitized, submit a request through the contact page and a member of the team will coordinate access options with you.',
  },
  {
    question: 'How do I cite photographs from the archive in my research?',
    answer:
      'Each record in the catalogue includes a recommended citation. When in doubt, credit the photographer (if known), collection title, item identifier, Akkasah: The Photography Archive at NYU Abu Dhabi, and the date you accessed the material.',
  },
  {
    question: 'Is it possible to license images for publication or exhibition?',
    answer:
      'Yes. Provide details about the image(s) you would like to use, the format of publication or exhibition, and your timeline. The Akkasah team will review the request and share the relevant permissions process.',
  },
  {
    question: 'Do you accept donations or new collections?',
    answer:
      'Akkasah actively collaborates with photographers, families, and institutions to expand the archive. Use the contact form to introduce the collection, and we will follow up to discuss stewardship and digitization.',
  },
  {
    question: 'Where can I learn about events, workshops, or residency opportunities?',
    answer:
      'Announcements are shared on the Akkasah website and through NYU Abu Dhabi communications. You can also reach out to the team via the contact page to express interest in upcoming programming.',
  },
]

const FAQ = () => {
  return (
    <div className="bg-white">
      <section className="bg-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-widest text-accent-300 font-semibold">Support</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold">Frequently Asked Questions</h1>
          <p className="mt-6 text-lg text-primary-200">
            Explore answers to the questions we receive most often about the Akkasah archive, access policies, and opportunities
            to collaborate with the team.
          </p>
        </div>
      </section>

      <FAQSection faqs={faqs} showContactCta />
    </div>
  )
}

export default FAQ

