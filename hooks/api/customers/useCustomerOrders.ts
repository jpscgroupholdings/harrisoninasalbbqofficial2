import { OrderParams, useOrderBase, useOrdersBase } from "../useOrdersBase";

export const useCustomerOrders = (params?: OrderParams) => {
  return useOrdersBase("customer", params);
};

export const useCustomerOrder = (id: string) => {
  return useOrderBase("customer", id);
};
