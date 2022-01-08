module.exports = {
  port: process.env.PORT || 3000,
  security: {
    SECRET_KEY: "session_secret_key_string",
    // アカウントロック（試行失敗をカウントする期間 min）
    ACCOUNT_LOCK_WINDOW: 30,
    // アカウントロック（何回試行失敗でロックするか）
    ACCOUNT_LOCK_THRESHOLD: 2,
    // アカウントロック（ロック時間 min）
    ACCOUNT_LOCK_TIME: 60,
    // ログイン履歴の保持件数
    MAX_LOGIN_HISTORY: 5
  },
  search: {
    MAX_ITEMS_PER_PAGE: 5
  }
};