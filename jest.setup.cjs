// Optional: Add global testing libraries or mocks
const localStorageMock = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value.toString();
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Only set if not already defined
if (!global.localStorage) {
  global.localStorage = localStorageMock;
}

// Set up global window mock if not already present
if (!global.window) {
  global.window = {
    localStorage: localStorageMock,
    location: { reload: jest.fn() },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
}

module.exports = {
  localStorageMock
};