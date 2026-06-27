/**
 * Takes an express.js req object and returns only the data which is safe for logging (removes things like authorization headers)
 * @param {object} req Req object to sanitize
 * @returns Returns an object that is safe to be put into the console and log files
 */
function sanitizeRequest(req) {
    // only extract the metadata actually needed for debugging
    const safe = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        params: req.params,
        query: req.query
    };

    //sSafely copy body but delete every sensitive field
    if (req.body && typeof req.body === 'object') {
        const safeBody = { ...req.body };
        // sensitive keys to never log
        const sensitiveKeys = ['password', 'token', 'refresh_token', 'secret', 'authorization', 'code'];
        for (const key of sensitiveKeys) {
            delete safeBody[key];
        }
        safe.body = safeBody;
    }

    // Redact headers - only keep non-sensitive ones
    safe.headers = {
        'content-type': req.get('content-type'),
        'origin': req.get('origin'),
        'referer': req.get('referer')
        // exclude cookie and auth
    };

    return safe;
}

module.exports = { sanitizeRequest };