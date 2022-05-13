const fetch = require('node-fetch')
const FormData = require('form-data')

const { DSCP_API_HOST, DSCP_API_PORT } = require('../../env')
const { InternalError } = require('../../utils/errors')

const URL_PREFIX = `http://${DSCP_API_HOST}:${DSCP_API_PORT}/v3`

const lastTokenId = async (authToken) => {
  const res = await fetch(`${URL_PREFIX}/last-token`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${authToken}`,
    },
  })

  if (res.ok) {
    const id = await res.json()
    return id
  }

  throw new InternalError({ message: 'Internal server error', service: 'dscp-api' })
}

const getItemById = async (authToken, tokenId) => {
  const res = await fetch(`${URL_PREFIX}/item/${tokenId}`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${authToken}`,
    },
  })

  if (res.ok) {
    const item = await res.json()
    return item
  }

  throw new InternalError({ message: 'Internal server error', service: 'dscp-api' })
}

const runProcess = async (authToken, inputs, outputs) => {
  const formData = new FormData()
  formData.append('request', JSON.stringify({ inputs, outputs }))

  const res = await fetch(`${URL_PREFIX}/run-process`, {
    method: 'POST',
    body: formData,
    headers: {
      authorization: `Bearer ${authToken}`,
    },
  })

  if (res.ok) {
    const ids = await res.json()
    return ids
  }

  throw new InternalError({ message: 'Internal server error', service: 'dscp-api' })
}

module.exports = { lastTokenId, getItemById, runProcess }
