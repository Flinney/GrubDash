/**
 * Validation for data sent in HTTP requests
 * @param {String} objName- Name of the object. Referenced in error message.
 * @param {Array} props- Array of keys. Each key must exist. 
 * @returns an object with a boolean property. If false, object has message 
 * property to be passed to error handler.
 */

function areValidProps(objName, props) {
  for (const key of Object.keys(props)) {
    if (!props[key]) {
      return { bool: false, message: `${objName} must include a ${key}` };
    }
  }
  return { bool: true };
}

module.exports = areValidProps;
