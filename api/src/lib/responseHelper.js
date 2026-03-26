export const successResponse = (data, message = 'Succès', statusCode = 200, extra = {}) => ({
  statusCode,
  message,
  data,
  ...extra,
});

export const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};
