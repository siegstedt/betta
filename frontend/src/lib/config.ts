// Environment configuration with fallbacks
export const config = {
  // For server-side (Docker), use host.docker.internal to reach backend on host
  // For client-side, use NEXT_PUBLIC_API_URL or localhost
  apiUrl:
    typeof window === 'undefined'
      ? 'http://host.docker.internal:8000'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  // Add other environment variables here as needed
};
