/**
 * Utility functions for handling API errors
 */

/**
 * Extract error message from API error response
 * Handles both string and object error formats
 * In development mode, includes validation details and logs to console
 * 
 * @param error - The error object from API call (usually AxiosError)
 * @param fallback - Fallback message if error cannot be extracted
 * @returns Error message string
 */
export function getErrorMessage(error: any, fallback = 'Đã xảy ra lỗi'): string {
  if (!error) return fallback;

  const isDev = import.meta.env.DEV;
  const err = error?.response?.data?.error;

  if (isDev) {
    console.error('API Error:', error);
    console.error('Error Response:', error?.response?.data);
  }

  // 1) error is string
  if (typeof err === 'string') return err;

  // 2) error is object
  if (err && typeof err === 'object') {
    // Validation error with details
    if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
      const detailMsgs = err.details
        .map((d: any) =>
          typeof d === 'object' && d.field && d.message
            ? `${d.field}: ${d.message}`
            : String(d)
        )
        .join('; ');

      if (isDev) {
        return `${err.message || 'Dữ liệu không hợp lệ'}\nChi tiết: ${detailMsgs}`;
      }

      // Production: show first error only
      const first = err.details[0];
      return first?.message || err.message || 'Dữ liệu không hợp lệ';
    }

    // Normal error object
    if (typeof err.message === 'string') return err.message;
  }

  // 3) Fallback from AxiosError.message
  if (typeof error?.message === 'string') return error.message;

  return fallback;
}

/**
 * Extract error code from API error response
 * 
 * @param error - The error object from API call
 * @returns Error code string or null
 */
export function getErrorCode(error: any): string | null {
  return error?.response?.data?.error?.code ?? null;
}

/**
 * Extract error details from API error response
 * Usually contains validation field errors
 * 
 * @param error - The error object from API call
 * @returns Error details array or null
 */
export function getErrorDetails(error: any): any {
  return error?.response?.data?.error?.details ?? null;
}
  