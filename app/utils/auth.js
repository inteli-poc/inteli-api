const jwksRsa = require('jwks-rsa')
const jwt = require('jsonwebtoken')
const { AUTH_JWKS_URI, AUTH_AUDIENCE, AUTH_ISSUER } = require('../env')
const { UnauthorizedError } = require('../utils/errors')

const client = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: AUTH_JWKS_URI,
})

async function getKey(header, cb) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err)

    const signingKey = key.publicKey || key.rsaPublicKey
    cb(null, signingKey)
  })
}

const verifyJwks = async (req) => {
  const authHeader = req.headers['authorization']
  const authToken = authHeader ? authHeader.replace('Bearer ', '') : ''

  const verifyOptions = {
    audience: AUTH_AUDIENCE,
    issuer: [AUTH_ISSUER],
    algorithms: ['RS256'],
    header: authToken,
  }

  return new Promise((resolve, reject) => {
    jwt.verify(authToken, getKey, verifyOptions, (err, decoded) => {
      if (err) {
        reject(new UnauthorizedError({ message: 'An error occurred during jwks verification' }))
      }

      req.token = authToken
      req.user = decoded
      resolve(true)
    })
  })
}

module.exports = {
  verifyJwks,
}
