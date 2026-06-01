function jsonError(res, error) {
  res.statusCode = 500;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: error.message || "Function failed before API dispatch" }, null, 2));
}

function dispatch(fallbackPath) {
  return async function handler(req, res) {
    try {
      const { handleApi } = require("../memoryalpha.cjs");
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "memoryalpha.vercel.app";
      const incoming = new URL(req.url || fallbackPath, `${protocol}://${host}`);
      let pathname = incoming.pathname;
      if (pathname.includes("[")) {
        const id = req.query && (req.query.id || req.query.memoryId);
        pathname = id && fallbackPath.includes(":id") ? fallbackPath.replace(":id", encodeURIComponent(id)) : fallbackPath;
      }
      const url = new URL(`${pathname}${incoming.search}`, `${protocol}://${host}`);
      await handleApi(req, res, url);
    } catch (error) {
      jsonError(res, error);
    }
  };
}

module.exports = { dispatch };
