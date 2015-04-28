module.exports = {
  create: {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      description: {
        type: 'string'
      }
    },
    required: ['name']
  },

  update: {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      description: {
        type: 'string'
      }
    },
    required: ['name']
  }
};