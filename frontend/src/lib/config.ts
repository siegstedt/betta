// Environment configuration - all values must be set in .env files
export const config = {
  apiUrl:
    typeof window === 'undefined'
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL,
  // Add other environment variables here as needed
};

// Validate required environment variables (only in runtime, not build time)
if (typeof window !== 'undefined' && !config.apiUrl) {
  throw new Error(
    'API URL not configured. Please set NEXT_PUBLIC_API_URL in your .env file.'
  );
}

if (typeof window === 'undefined' && !config.apiUrl) {
  // For server-side, provide a fallback or warning
  console.warn(
    'API_URL not set for server-side. Please set API_URL in your .env file.'
  );
}
