const responseHelper = {
  success: (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  },

  error: (res, message, statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      status: "error",
      message,
      errors,
    });
  },
};

module.exports = responseHelper;
