module.exports = {
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || "3306",
  user: process.env.MYSQL_USER || "admin",
  password: process.env.MYSQL_PASSWORD || "Passw0rd",
  database: process.env.MYSQL_DATABASE || "tastylog"
};