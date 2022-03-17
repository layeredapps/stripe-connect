module.exports = {
  setup: (doc, stripeAccount) => {
    const removeElements = []
    if (stripeAccount.submittedAt) {
      removeElements.push(
        'navbar-submit-link'
      )
    }
    if (stripeAccount.business_type === 'individual') {
      removeElements.push(
        'navbar-persons-link',
        'navbar-submit-company-owners-link',
        'navbar-submit-company-directors-link'
      )
    } else {
      if (stripeAccount.submittedAt) {
        removeElements.push(
          'navbar-submit-company-owners-link',
          'navbar-submit-company-directors-link'
        )
      } else {
        if (!stripeAccount.requiresOwners) {
          removeElements.push('navbar-submit-company-owners-link')
        }
        if (!stripeAccount.requiresExecutives) {
          removeElements.push('navbar-submit-company-executives-link')
        }
        if (!stripeAccount.requiresDirectors) {
          removeElements.push('navbar-submit-company-directors-link')
        }
      }
    }
    const template = doc.getElementById('navbar')
    for (const id of removeElements) {
      const element = template.getElementById(id)
      element.parentNode.removeChild(element)
    }
  }
}
