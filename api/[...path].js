const { handleApi } = require("../server.cjs");

module.exports = async function handler(req, res) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "memoryalpha.vercel.app";
  const url = new URL(req.url, `${protocol}://${host}`);
  await handleApi(req, res, url);
};
