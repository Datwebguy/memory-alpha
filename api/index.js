module.exports = async function handler(req, res) {
  try {
    const { handleApi } = require("../server.cjs");
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "memoryalpha.vercel.app";
    const incoming = new URL(req.url, `${protocol}://${host}`);
    const rewrittenPath = incoming.searchParams.get("path");
    const pathname = rewrittenPath ? `/api/${rewrittenPath}` : incoming.pathname;
    incoming.searchParams.delete("path");
    const query = incoming.searchParams.toString();
    const url = new URL(`${pathname}${query ? `?${query}` : ""}`, `${protocol}://${host}`);
    await handleApi(req, res, url);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: error.message || "Function failed before API dispatch" }, null, 2));
  }
};
