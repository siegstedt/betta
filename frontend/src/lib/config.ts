// Environment configuration - reads from root .env file
export const config = {
  apiUrl:
    typeof window === 'undefined'
      ? process.env.API_URL || 'http://localhost:8000'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  // Add other environment variables here as needed
};
