const yaml = require("yaml");
const fs = require('fs');
const path = require('path');
const util = require('util');


const yamlConfig = fs.readFileSync("./config.yaml", 'utf8')
const loggingLevel = yaml.parse(yamlConfig).logging_level
const logFileConfig = yaml.parse(yamlConfig).log_file
const logFileDirectory = path.join(process.cwd(), logFileConfig);

/**
 * Writes a log message to the log file
 * @param {string} level log level (e.g. 'INFO', 'ERROR')
 * @param {...any} data the objects, as if it were a console.log() statement
 */
function logToFile(level, ...data) {
    // check if user even has log files enabled
    if(!logFileConfig) { return }

    // format the message
    const message = util.format(...data);

    // combine message with timestamp and level
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    // append to file
    fs.appendFileSync(logFileDirectory, logEntry);
}

/**
 * Sends a level 3 console success message. Only affects the actual output in the console, not the log file
 * @param {...any} data The objects to log to console and file
 */
function success(...data) {
    if (loggingLevel < 3) {
        // if logging level is less than 3 (everything important), then this should not show up
        return
    }

    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.log(util.styleText("green", `[${timestamp}]`), message)
    // log to file
    logToFile("INFO", message)
}

/**
 * Sends a level 3 console log, equivalent to console.log()
 * @param {...any} data The objects to log to console and file
 */
function log(...data) {
    if (loggingLevel < 3) {
        // if logging level is less than 3 (everything important), then this should not show up
        return
    }

    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.log(`[${timestamp}]`, message)
    // log to file
    logToFile("INFO", message)
}

/**
 * Sends a level 2 console warning, equivalent to console.warn()
 * @param {...any} data The objects to log to console and file
*/
function warn(...data) {
    if (loggingLevel < 2) {
        // if logging level is less than 2 (errors and warnings), then this should not show up
        return
    }
    
    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.warn(util.styleText("yellow", `[${timestamp}]`), message)
    // log to file
    logToFile("WARN", message)
}

/**
 * Sends a level 1 console warning, equivalent to console.error()
 * @param {...any} data The objects to log to console and file
*/
function error(...data) {
    if (loggingLevel < 1) {
        // if logging level is less than 1 (errors), then this should not show up
        return
    }
    
    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.warn(util.styleText("red", `[${timestamp}]`), message)
    // log to file
    logToFile("ERROR", message)
}

/**
 * Sends a level 0 fatal error
 * @param {...any} data The objects to log to console and file
*/
function fatal(...data) {
    if (loggingLevel < 0) {
        // if logging level is less than 1 (errors), then this should not show up
        return
    }
    
    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.warn(util.styleText("bgRed", `[${timestamp}]`), message)
    // log to file
    logToFile("FATAL", message)
}

/**
 * Sends a level 0 console info message. This will always show up. Intended for use with start and shut down messages
 * @param {...any} data The objects to log to console and file
 */
function force_info(...data) {
    if (loggingLevel < 0) {
        // if logging level is less than 0, this will not show up
        return
    }

    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.log(util.styleText("bgCyan", `[${timestamp}]`), message)
    // log to file
    logToFile("INFO", message)
}

/**
 * Sends a level 0 console success message. This will always show up. Intended for use with start and shut down messages
 * @param {...any} data The objects to log to console and file
 */
function force_success(...data) {
    if (loggingLevel < 0) {
        // if logging level is less than 0, this will not show up
        return
    }

    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.log(util.styleText("bgGreen", `[${timestamp}]`), message)
    // log to file
    logToFile("INFO", message)
}

/**
 * Sends a level 0 console warn message. This will always show up. Intended for use with start and shut down messages
 * @param {...any} data The objects to log to console and file
 */
function force_warn(...data) {
    if (loggingLevel < 0) {
        // if logging level is less than 0, this will not show up
        return
    }

    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.log(util.styleText("bgYellow", `[${timestamp}]`), message)
    // log to file
    logToFile("WARN", message)
}

/**
 * Sends a level 0 console error message. This will always show up. Intended for use with start and shut down messages
 * @param {...any} data The objects to log to console and file
 */
function force_error(...data) {
    if (loggingLevel < 0) {
        // if logging level is less than 0, this will not show up
        return
    }

    // make it more human readable
    const message = util.format(...data);
    // get current timestamp as iso string
    const timestamp = new Date().toISOString();
    // log to actual console
    console.log(util.styleText("bgRed", `[${timestamp}]`), message)
    // log to file
    logToFile("ERROR", message)
}

module.exports = { 
    log, 
    warn, 
    error,
    fatal,
    force_info, 
    force_success,
    force_warn,
    force_error, 
    logToFile 
}
