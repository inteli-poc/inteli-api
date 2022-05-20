const fetch = require('node-fetch')

const logger = require('../../app/utils/Logger')
const { AUTH_TOKEN_URL, AUTH_AUDIENCE } = require('../../app/env')

let authToken

const getAuthToken = async () => {
  if (authToken) return authToken

  const response = await fetch(AUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: process.env.AUTH_TEST_USERNAME,
      password: process.env.AUTH_TEST_PASSWORD,
      client_id: process.env.AUTH_TEST_CLIENT_ID,
      client_secret: process.env.AUTH_TEST_CLIENT_SECRET,
      audience: AUTH_AUDIENCE,
    }),
  })
  const data = await response.json()

  if (response.status === 200) {
    authToken = data.access_token
    return authToken
  } else {
    logger.error(`Test user Auth0 error: ${data.error_description}`)
  }
}

module.exports = { getAuthToken }
