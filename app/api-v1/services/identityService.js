const fetch = require('node-fetch')

const { BadRequestError, InternalError } = require('../../utils/errors')

const { IDENTITY_SERVICE_HOST, IDENTITY_SERVICE_PORT } = require('../../env')
const URL_PREFIX = `http://${IDENTITY_SERVICE_HOST}:${IDENTITY_SERVICE_PORT}/v1`

const getMemberByAlias = async (req, alias) => {
  const res = await fetch(`${URL_PREFIX}/members/${encodeURIComponent(alias)}`, {
    headers: {
      Authorization: `Bearer ${req.token}`,
    },
  })

  if (res.ok) {
    const member = await res.json()
    return member
  }

  if (res.status === 404) {
    throw new BadRequestError({ message: `Member "${alias}" does not exist` })
  }

  throw new InternalError({ message: 'Internal server error' })
}

const getMemberBySelf = async (req) => {
  const response = await fetch(`${URL_PREFIX}/self`, {
    headers: {
      Authorization: `Bearer ${req.token}`,
    },
  })

  if (response.ok) {
    const member = await response.json()
    return member
  }

  throw new InternalError({ message: 'Internal server error' })
}

const getMemberByAddress = (...args) => getMemberByAlias(...args)

module.exports = {
  getMemberByAlias,
  getMemberByAddress,
  getMemberBySelf,
}
