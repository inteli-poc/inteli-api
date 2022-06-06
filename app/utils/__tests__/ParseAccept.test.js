const { expect } = require('chai')
const { it } = require('mocha')
const { parseAccept } = require('../../utils/parseAcceptHeader')

describe('ParseAccept', function () {
  it('should return application/json', function () {
    expect(parseAccept('application/json')[0]).to.equal('application/json')
  })

  it('should return application/octet-stream', function () {
    expect(parseAccept('application/octet-stream')[0]).to.equal('application/octet-stream')
  })

  it('should return [ application/json, application/*]', function () {
    expect(parseAccept('application/json, application/*')).deep.equal(['application/json', 'application/*'])
  })

  it('should return [ application/json, application/*]', function () {
    expect(parseAccept('application/json, application/*;q=0.9')).deep.equal(['application/json', 'application/*'])
  })

  it('should return [ application/json, app;ication//*, application/octect-stream]', function () {
    expect(parseAccept('application/json, application/octet-stream;q=0.1, application/*')).deep.equal([
      'application/json',
      'application/*',
      'application/octet-stream',
    ])
  })

  it('should return [ application/json, application/*]', function () {
    expect(parseAccept('application/json;q=0.9, application/*')).deep.equal(['application/*', 'application/json'])
  })

  it('should return [ application/json, application/octet-stream, application/*]', function () {
    expect(parseAccept('application/json, application/*, application/octet-stream')).deep.equal([
      'application/json',
      'application/octet-stream',
      'application/*',
    ])
  })

  it('should return [ application/json, image/*]', function () {
    expect(parseAccept('image/*, application/json')).deep.equal(['application/json', 'image/*'])
  })
})
