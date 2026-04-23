// [middlewares/errorMiddleware.js]
const errorMiddleware = (err, req, res, next) => {
  console.error("🔥 FULL ERROR:", err);

  const status = err.status || 500;
  const message = err.message || (typeof err === 'string' ? err : "Internal Server Error");

  res.status(status).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorMiddleware;