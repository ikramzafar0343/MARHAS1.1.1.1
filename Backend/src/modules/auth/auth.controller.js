import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { authService } from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body, req, res);
  return successResponse(res, {
    message: 'Registration successful',
    data,
    statusCode: 201
  });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body, req, res);
  return successResponse(res, { message: 'Login successful', data });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body, req, res, { adminOnly: true });
  return successResponse(res, { message: 'Admin login successful', data });
});

export const logout = asyncHandler(async (req, res) => {
  const data = await authService.logout(req, res);
  return successResponse(res, { message: 'Logged out successfully', data });
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req, res);
  return successResponse(res, { message: 'Token refreshed', data });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body);
  return successResponse(res, { message: data.message, data: null });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  return successResponse(res, { message: 'Password reset successful', data });
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user._id, req.body);
  return successResponse(res, { message: 'Password changed successfully', data });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const data = await authService.verifyEmail(req.params.token);
  const message = data.alreadyVerified
    ? 'Email is already verified'
    : 'Email verified successfully';
  return successResponse(res, { message, data: { user: data.user } });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const data = await authService.resendVerification(req.user._id);
  return successResponse(res, { message: 'Verification email sent', data });
});

export const getMe = asyncHandler(async (req, res) => {
  const data = await authService.getMe(req.user._id);
  return successResponse(res, { message: 'Profile retrieved', data });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const data = await authService.uploadAvatar(req.user._id, req.file);
  return successResponse(res, { message: 'Profile photo updated', data });
});

export const getSessions = asyncHandler(async (req, res) => {
  const data = await authService.getSessions(req.user._id);
  return successResponse(res, { message: 'Sessions retrieved', data });
});

export const revokeSession = asyncHandler(async (req, res) => {
  const data = await authService.revokeSession(req.user._id, req.body.sessionId);
  return successResponse(res, { message: 'Session revoked', data });
});

export const revokeAllSessions = asyncHandler(async (req, res) => {
  const data = await authService.revokeAllSessions(req.user._id);
  return successResponse(res, { message: 'All sessions revoked', data });
});
