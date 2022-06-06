// parse accept header into ordered list of preferences
const parseAccept = (acceptHeader) =>
  acceptHeader
    .split(',')
    .map((acceptElement) => {
      const trimmed = acceptElement.trim()
      const [mimeType, quality = 1] = trimmed.split(';q=')
      return { mimeType, quality }
    })
    .sort((a, b) => {
      if (a.quality !== b.quality) {
        return b.quality - a.quality
      }
      const [aType, aSubtype] = a.mimeType.split('/')
      const [bType, bSubtype] = b.mimeType.split('/')
      if (aType === '*' && bType !== '*') {
        return 1
      }
      if (aType !== '*' && bType === '*') {
        return -1
      }
      if (aSubtype === '*' && bSubtype !== '*') {
        return 1
      }
      if (aSubtype !== '*' && bSubtype === '*') {
        return -1
      }
      return 0
    })
    .map(({ mimeType }) => mimeType)

module.exports = { parseAccept }
