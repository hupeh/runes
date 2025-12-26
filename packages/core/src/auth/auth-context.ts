import { createContext } from "react";
import type { AuthProvider } from "./types";

/**
 * 认证上下文
 *
 * 用于在组件树中传递 AuthProvider 实例
 *
 * @private
 */
export const AuthContext = createContext<AuthProvider>({});
