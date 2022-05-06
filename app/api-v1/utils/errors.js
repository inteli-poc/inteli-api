class ReceipeError extends Error {
  constructor({ code, message, operationName }) {
    super(message)
    this.code = code
    this.operationName = operationName
  }
}

module.exports = {
  ReceipeError,
}
