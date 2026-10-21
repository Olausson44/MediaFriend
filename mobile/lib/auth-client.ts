import { createAuthClient } from "better-auth/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./api.js";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  storage: AsyncStorage,
});
