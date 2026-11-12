export type StoreControls = {
  live: boolean;
  orders: boolean;
  onlinePay: boolean;
  cod: boolean;
  maintenance: boolean;
};

export const DEFAULT_STORE_CONTROLS: StoreControls = {
  live: true,
  orders: true,
  onlinePay: true,
  cod: true,
  maintenance: false,
};
