module.exports = {
  port: process.env.PORT || 3000,
  security: {
    SECRET_KEY: "session_secret_key_string"
  },
  search: {
    MAX_ITEMS_PER_PAGE: 5
  }
};