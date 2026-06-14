const { AppError } = require('./errorHandler');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => d.message).join(', ');
      return next(new AppError(`Validation failed: ${details}`, 400));
    }

    req.body = value;
    next();
  };
};

module.exports = validate;
