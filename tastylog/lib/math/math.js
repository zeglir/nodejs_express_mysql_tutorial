const roundTo = require("round-to");

const padding = value => {
  if (isNaN(parseFloat(value))) {
    return "-";
  }
  // toPrecision は Numberを指定した精度で表す文字列を返す
  return roundTo(value, 2).toPrecision(3);
};

const round = value => {
  return roundTo(value, 2);
};

module.exports = {
  padding,
  round
};