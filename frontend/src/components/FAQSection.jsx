import React from 'react'
import { Link } from 'react-router-dom'

const FAQSection = ({
  faqs,
  title = 'Frequently Asked Questions',
  description = 'Find quick answers to the questions people ask the Akkasah team most often.',
  showContactCta = false,
}) => {
  if (!Array.isArray(faqs) || faqs.length === 0) {
    return null
  }

  return (
    <section className="bg-primary-50 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary-900 sm:text-4xl">{title}</h2>
          {description && (
            <p className="mt-4 text-lg text-primary-600">{description}</p>
          )}
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="bg-white shadow-sm rounded-xl p-6 group border border-primary-100 focus-within:ring-2 focus-within:ring-accent-500"
            >
              <summary className="flex items-start justify-between cursor-pointer">
                <h3 className="text-lg font-semibold text-primary-900 pr-4">{faq.question}</h3>
                <span className="ml-4 text-accent-600 font-medium group-open:hidden">Show</span>
                <span className="ml-4 text-accent-600 font-medium hidden group-open:block">Hide</span>
              </summary>
              <div className="mt-4 text-primary-700 leading-relaxed">
                {Array.isArray(faq.answer)
                  ? faq.answer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                  : faq.answer}
              </div>
            </details>
          ))}
        </div>

        {showContactCta && (
          <div className="mt-12 text-center">
            <p className="text-primary-600">Still have questions?</p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center mt-3 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-accent-600 hover:bg-accent-700 transition-colors duration-200"
            >
              Get in touch with us
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default FAQSection

