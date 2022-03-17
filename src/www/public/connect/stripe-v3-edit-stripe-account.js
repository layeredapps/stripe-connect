let stripe
window.onload = function () {
  const stripePublishableKey = document.getElementById('stripe-publishable-key')
  stripe = window.Stripe(stripePublishableKey.value)
  const submit = document.getElementById('submit-form')
  submit.addEventListener('submit', updateStripeAccount)
  window.loaded = true
}

function updateStripeAccount (e) {
  e.preventDefault()
  e.target.disabled = true
  setTimeout(function () {
    e.target.disabled = false
  }, 1000)
  const businessType = document.getElementById('company-container') ? 'company' : 'individual'
  const accountData = {}
  accountData[businessType] = {}
  if (businessType === 'individual') {
    const firstName = document.getElementById('individual_first_name')
    if (firstName) {
      if (!firstName.value) {
        return window.renderError('invalid-individual_first_name')
      }
      accountData[businessType].first_name = firstName.value
    }
    const lastName = document.getElementById('individual_last_name')
    if (lastName) {
      if (!lastName.value) {
        return window.renderError('invalid-individual_last_name')
      }
      accountData[businessType].last_name = lastName.value
    }
    const firstNameKanji = document.getElementById('individual_first_name_kanji')
    if (firstNameKanji) {
      if (!firstNameKanji.value || !firstNameKanji.value.length) {
        return window.renderError('invalid-individual_first_name_kanji')
      }
      accountData[businessType].first_name_kanji = firstNameKanji.value
    }
    const lastNameKanji = document.getElementById('individual_last_name_kanji')
    if (lastNameKanji) {
      if (!lastNameKanji.value || !lastNameKanji.value.length) {
        return window.renderError('invalid-individual_last_name_kanji')
      }
      accountData[businessType].last_name_kanji = lastNameKanji.value
    }
    const firstNameKana = document.getElementById('individual_first_name_kana')
    if (firstNameKana) {
      if (!firstNameKana.value || !firstNameKana.value.length) {
        return window.renderError('invalid-individual_first_name_kana')
      }
      accountData[businessType].first_name_kana = firstNameKana.value
    }
    const lastNameKana = document.getElementById('individual_last_name_kana')
    if (lastNameKana) {
      if (!lastNameKana.value || !lastNameKana.value.length) {
        return window.renderError('invalid-individual_last_name_kana')
      }
      accountData[businessType].last_name_kana = lastNameKana.value
    }
    const email = document.getElementById('individual_email')
    if (email) {
      if (!email.value || !email.value.length) {
        return window.renderError('invalid-individual_email')
      }
      accountData[businessType].email = email.value
    }
    const phone = document.getElementById('individual_phone')
    if (phone) {
      if (!phone.value || !phone.value.length) {
        return window.renderError('invalid-individual_phone')
      }
      accountData[businessType].phone = phone.value
    }
    const ssnLast4 = document.getElementById('individual_ssn_last_4')
    if (ssnLast4) {
      if (!ssnLast4.value || !ssnLast4.value.length) {
        return window.renderError('invalid-individual_ssn_last_4')
      }
      accountData[businessType].ssn_last_4 = ssnLast4.value
    }
    const gender = document.getElementById('gindividual_ender-container')
    if (gender) {
      const female = document.getElementById('female')
      const male = document.getElementById('male')
      if (!female.checked && !male.checked) {
        return window.renderError('invalid-individual_gender')
      }
      accountData[businessType].gender = female.checked ? 'female' : 'male'
    }
    const idNumber = document.getElementById('individual_id_number')
    if (idNumber) {
      if (!idNumber.value || !idNumber.value.length) {
        return window.renderError('invalid-individual_id_number')
      }
      accountData.id_number = idNumber.value
    }
    const dobDay = document.getElementById('individual_dob_day')
    if (dobDay) {
      accountData[businessType].dob = {
        day: dobDay.value,
        month: document.getElementById('individual_dob_month').value,
        year: document.getElementById('individual_dob_year').value
      }
      if (!accountData[businessType].dob.day) {
        return window.renderError('invalid-individual_dob_day')
      }
      if (!accountData[businessType].dob.month) {
        return window.renderError('invalid-individual_dob_month')
      }
      if (!accountData[businessType].dob.year) {
        return window.renderError('invalid-individual_dob_year')
      }
      try {
        Date.parse(accountData[businessType].dob.year + '/' + accountData[businessType].dob.month + '/' + accountData[businessType].dob.day)
      } catch (eror) {
        return window.renderError('invalid-individual_dob_day')
      }
    }
  } else {
    const companyName = document.getElementById('company_name')
    if (companyName) {
      if (!companyName.value) {
        return window.renderError('invalid-company_name')
      }
      accountData[businessType].name = companyName.value
    }
    const companyNameKana = document.getElementById('company_name_kana')
    if (companyNameKana) {
      if (!companyNameKana.value) {
        return window.renderError('invalid-company_name_kana')
      }
      accountData[businessType].name_kana = companyNameKana.value
    }
    const companyNameKanji = document.getElementById('company_name_kanji')
    if (companyNameKanji) {
      if (!companyNameKanji.value) {
        return window.renderError('invalid-company_name_kanji')
      }
      accountData[businessType].name_kanji = companyNameKanji.value
    }
    const companyTaxID = document.getElementById('company_tax_id')
    if (companyTaxID) {
      if (!companyTaxID.value) {
        return window.renderError('invalid-company_tax_id')
      }
      accountData[businessType].tax_id = companyTaxID.value
    }
  }
  const businessProfileURL = document.getElementById('business_profile_url')
  if (businessProfileURL) {
    if (!businessProfileURL.value) {
      return window.renderError('invalid-business_profile_url')
    }
  }
  const businessProfileMCC = document.getElementById('business_profile_mcc')
  if (businessProfileMCC) {
    if (businessProfileMCC.selectedIndex < 1) {
      return window.renderError('invalid-business_profile_mcc')
    }
  }
  let fields, i, len, property, element
  if (document.getElementById(businessType + '-address-container')) {
    accountData[businessType].address = {}
    fields = ['address_line1', 'address_city', 'address_state', 'address_country', 'address_postal_code']
    for (i = 0, len = fields.length; i < len; i++) {
      element = document.getElementById(businessType + '_' + fields[i])
      if (element) {
        if (!element.value) {
          return window.renderError('invalid-' + businessType + '_' + fields[i])
        }
        property = fields[i].substring('address_'.length)
        accountData[businessType].address[property] = element.value
      }
    }
    const addressLine2 = document.getElementById(businessType + '_address_line2')
    if (addressLine2 && addressLine2.value) {
      accountData[businessType].address.line2 = addressLine2.value
    }
  }
  if (document.getElementById(businessType + 'kana-address-container')) {
    accountData[businessType].address_kana = {}
    fields = ['address_kana_line1', 'address_kana_city', 'address_kana_town', 'address_kana_state', 'address_kana_postal_code']
    for (i = 0, len = fields.length; i < len; i++) {
      element = document.getElementById(fields[i])
      if (element) {
        if (!element.value) {
          return window.renderError('invalid-' + fields[i])
        }
        property = fields[i].substring('address_kana'.length)
        accountData[businessType].address_kana[property] = element.value
      }
    }
  }
  if (document.getElementById(businessType + 'kanji-address-container')) {
    accountData[businessType].address_kanji = {}
    fields = ['address_kanji_line1', 'address_kanji_city', 'address_kanji_town', 'address_kanji_state', 'address_kanji_postal_code']
    for (i = 0, len = fields.length; i < len; i++) {
      element = document.getElementById(businessType + '_' + fields[i])
      if (element) {
        if (!element.value) {
          return window.renderError('invalid-' + businessType + '_' + fields[i])
        }
        property = fields[i].substring('address_kanji'.length)
        accountData[businessType].address_kanji[property] = element.value
      }
    }
  }
  const documentFront = document.getElementById(businessType + '_verification_document_front')
  const documentBack = document.getElementById(businessType + '_verification_document_back')
  return window.uploadDocumentFiles(documentFront, documentBack, function (error, front, back) {
    if (error) {
      return window.renderError(error.message)
    }
    if (front && front.id) {
      accountData[businessType].verification = {
        document: {
          front: front.id
        }
      }
    } else if (documentFront) {
      return window.renderError(`invalid-${businessType}_verification_additional_document_front`)
    }
    if (back && back.id) {
      accountData[businessType].verification = accountData[businessType].verification || {}
      accountData[businessType].verification.document = accountData[businessType].verification.document || {}
      accountData[businessType].verification.document.back = back.id
    } else if (documentBack) {
      return window.renderError(`invalid-${businessType}_verification_additional_document_back`)
    }
    const additionalDocumentFront = document.getElementById(businessType + '_verification_additional_document_front')
    const additionalDocumentBack = document.getElementById(businessType + '_verification_additional_document_back')
    return window.uploadDocumentFiles(additionalDocumentFront, additionalDocumentBack, function (error, front, back) {
      if (error) {
        return window.renderError(error.message)
      }
      if (front && front.id) {
        accountData[businessType].verification = accountData[businessType].verification || {}
        accountData[businessType].verification.additional_document = {
          front: front.id
        }
      } else if (additionalDocumentFront) {
        return window.renderError(`invalid-${businessType}_verification_additional_document_front`)
      }
      if (back && back.id) {
        accountData[businessType].verification = accountData[businessType].verification || {}
        accountData[businessType].verification.additional_document = accountData[businessType].verification.additional_document || {}
        accountData[businessType].verification.additional_document.back = back.id
      } else if (additionalDocumentBack) {
        return window.renderError(`invalid-${businessType}_verification_additional_document_back`)
      }
      if (!Object.keys(accountData[businessType]).length) {
        const form = document.getElementById('submit-form')
        return form.submit()
      }
      return stripe.createToken('account', accountData).then(function (result) {
        if (!result || result.error) {
          return window.renderError(result.error)
        }
        const token = document.getElementById('token')
        token.value = result.token.id
        const form = document.getElementById('submit-form')
        return form.submit()
      })
    })
  })
}
