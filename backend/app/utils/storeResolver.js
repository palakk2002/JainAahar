import Seller from "../models/seller.js";

let cachedStoreId = null;

export const resolveAdminStore = async () => {
  if (cachedStoreId) {
    return cachedStoreId;
  }
  const defaultSeller = await Seller.findOne().sort({ createdAt: 1 });
  if (defaultSeller) {
    cachedStoreId = defaultSeller._id.toString();
    return cachedStoreId;
  }
  return null;
};

export const resolveAdminStoreDoc = async () => {
  return await Seller.findOne().sort({ createdAt: 1 });
};
