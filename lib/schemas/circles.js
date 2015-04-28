module.exports = {
  create: {
    type: 'object',
    properties: {
      name: {
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
      }
    },
    required: ['name']
  }
};