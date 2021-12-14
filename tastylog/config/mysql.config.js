module.exports = {
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || "3306",
  user: process.env.MYSQL_USER || "admin",
  password: process.env.MYSQL_PASSWORD || "Passw0rd",
  database: process.env.MYSQL_DATABASE || "tastylog",
  connectionLimit: process.env.MYSQL_CONNECTION_LIMIT ?
    parseInt(process.env.MYSQL_CONNECTION_LIMIT) : 10,
  queueLimit: process.env.MYSQL_QUEUE_LIMIT ?
    parseInt(process.env.MYSQL_QUEUE_LIMIT) : 0
};