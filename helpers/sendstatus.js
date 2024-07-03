function apiResponse(status, message, data, error) {
  const response = { status:status };

  if (message) {
    response.message = message;
  }

  if (data) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  return response;
}

export default apiResponse;
