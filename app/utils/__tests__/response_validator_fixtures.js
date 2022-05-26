module.exports = {
  exampleDoc: {
    summary: 'Example API',
    parameters: [],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                foo: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
}
