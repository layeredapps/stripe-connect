module.exports = {
  setup: (doc, stripeAccount) => {
    const template = doc.getElementById('navbar')
    if (!stripeAccount.requiresOwners) {
      const submitOwnersLink = template.getElementById('navbar-submit-company-owners-link')
      submitOwnersLink.parentNode.removeChild(submitOwnersLink)
    }
    if (!stripeAccount.requiresDirectors) {
      const submitDirectorsLink = template.getElementById('navbar-submit-directors-link')
      submitDirectorsLink.parentNode.removeChild(submitDirectorsLink)
    }
    if (!stripeAccount.requiresExecutives) {
      const submitDirectorsLink = template.getElementById('navbar-submit-executives-link')
      submitDirectorsLink.parentNode.removeChild(submitDirectorsLink)
    }
  }
}
