import { findUserByUsername } from "@modules/user/user.repository";
import bcrypt from "bcryptjs";

import {
    assertRefreshToken,
    buildAccessToken,
    buildRefreshToken,
    createAuthError,
    revokeUserRefreshTokens,
    rotateRefreshToken,
    storeRefreshToken,
} from "./auth.helpers";
import type { LoginResult, RefreshResult } from "./auth.types";

export const login = async (username: string, password: string): Promise<LoginResult> => {
    const user = await findUserByUsername(username);

    if (!user) {
        throw createAuthError("Username atau password salah.", 401, "INVALID_CREDENTIALS");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw createAuthError("Username atau password salah.", 401, "INVALID_CREDENTIALS");
    }

    const accessToken = buildAccessToken(user.id, user.username);
    const refreshToken = buildRefreshToken(user.id);

    storeRefreshToken(refreshToken, user.id);

    const { password: _password, ...safeUser } = user;

    return {
        user: safeUser,
        access_token: accessToken,
        refresh_token: refreshToken
    };
};

export const refresh = async (refreshToken: string): Promise<RefreshResult> => {
    const userId = assertRefreshToken(refreshToken);
    const tokens = rotateRefreshToken(refreshToken, userId);

    return { userId, ...tokens };
};

export const logout = async (userId: string): Promise<void> => {
    revokeUserRefreshTokens(userId);
};