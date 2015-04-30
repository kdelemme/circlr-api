module.exports = {
  create: {
    type: 'object',
    properties: {
      description: {
        type: 'string'
      }
    },
    required: ['description']
  },

  update: {
    type: 'object',
    properties: {
      description: {
        type: 'string'
      }
    },
    required: ['description']
  }
};