export default function notFoundHandler(request, response) {
  return response.status(404).json({
    error: 'Route not found',
    path: request.path,
    method: request.method,
  });
}