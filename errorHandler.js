const logger = require("./gen_functions/logger")

const errorHandler = (err, req, res, next) => {
    logger.error("An error occured when a resource was requested", err, req)
    res.status(500).send('Something went wrong! Please try again later :)');
};

module.exports = errorHandler;
