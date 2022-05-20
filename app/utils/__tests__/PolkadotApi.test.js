describe('polkadot api wrapper', () => {
  describe('run process method', () => {
    describe('if invalid payload', () => {
      it('throws 415 indicating that payload is invalid', () => {})
      it('throws 402 indicating that media type is invalid', () => {})
    })

    describe('if invalid token', () => {
      it('throws 401 indicating that authentication has failed', () => {})
    })

    it('returns token id that is due to be created', () => {})
  })
})
