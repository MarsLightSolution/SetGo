/**
 * Format success response
 */
exports.formatSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format error response
 */
exports.formatErrorResponse = (message, details = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.details = details;
  }

  return response;
};

/**
 * Format paginated response
 */
exports.formatPaginatedResponse = (data, pagination) => {
  return {
    success: true,
    data,
    pagination: {
      total: pagination.total,
      limit: pagination.limit,
      skip: pagination.skip,
      hasMore: pagination.skip + data.length < pagination.total,
    },
    timestamp: new Date().toISOString(),
  };
};