export interface NocState {
  health: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

export const initialState: NocState = {
  health: null,
  loading: false,
  error: null,
};
