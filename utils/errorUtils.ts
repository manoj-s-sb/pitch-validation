// Extracts a clean error message from an axios error or unknown error.
// Used in createAsyncThunk rejectWithValue calls.
export function handleApiError(error: any, fallback: string): string {
  return error?.response?.data?.message || error?.message || fallback;
}
