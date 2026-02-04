function createAPIGatewayResponse(statusCode, body, headers = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Credentials': 'true'
    };
  
    return {
      statusCode,
      headers: { ...defaultHeaders, ...headers },
      body: JSON.stringify(body),
      isBase64Encoded: false
    };
  }
  
  function createSuccessResponse(data, statusCode = 200, metadata) {
    const response = {
      success: true,
      data,
      ...(metadata && { metadata })
    };
  
    return createAPIGatewayResponse(statusCode, response);
  }
  
  function createErrorResponse(message, statusCode = 500, code, details) {
    const response = {
      success: false,
      message,
      ...(code && { code }),
      ...(details && { details })
    };
  
    return createAPIGatewayResponse(statusCode, response);
  }
  
  module.exports = {
    createAPIGatewayResponse,
    createSuccessResponse,
    createErrorResponse
  };
  