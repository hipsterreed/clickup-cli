export class ClickUpApiError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'ClickUpApiError';
    }
}
export function parseApiError(error) {
    const axiosErr = error;
    if (axiosErr.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;
        const serverMsg = data?.err ?? data?.error ?? '';
        switch (status) {
            case 401:
                return new ClickUpApiError('Invalid API token. Run `clickup setup` to reconfigure.', 401);
            case 403:
                return new ClickUpApiError('Access denied. You may not have permission to view this resource.', 403);
            case 404:
                return new ClickUpApiError('Resource not found. Check your task ID or list ID.', 404);
            case 429:
                return new ClickUpApiError('Rate limit hit. Please wait a moment and try again.', 429);
            default:
                return new ClickUpApiError(serverMsg
                    ? `API error (${status}): ${serverMsg}`
                    : `Unexpected API error (${status}).`, status);
        }
    }
    if (axiosErr.code === 'ECONNABORTED' || axiosErr.code === 'ETIMEDOUT') {
        return new ClickUpApiError('Request timed out. Check your internet connection.');
    }
    if (axiosErr.code === 'ENOTFOUND' || axiosErr.code === 'ECONNREFUSED') {
        return new ClickUpApiError('Cannot connect to ClickUp. Check your internet connection.');
    }
    const err = error;
    return new ClickUpApiError(err.message ?? 'An unknown error occurred.');
}
