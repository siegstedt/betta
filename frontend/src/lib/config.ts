// Environment configuration with fallbacks
export const config = {
  // For server-side (Docker), always use internal backend service
  // For client-side, use NEXT_PUBLIC_API_URL or localhost
  apiUrl:
    typeof window === 'undefined'
      ? 'http://backend:8000'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  // Add other environment variables here as needed
};
