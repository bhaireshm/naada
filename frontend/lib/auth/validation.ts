// Extracted validation logic following SRP
export const createAuthValidation = (isLogin: boolean) => ({
  email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
  password: (value: string) => {
    if (value.length === 0) return 'Password is required';
    if (!isLogin && value.length < 6) return 'Password must be at least 6 characters';
    return null;
  },
  ...(isLogin ? {} : {
    confirmPassword: (value: string | undefined, values: { password: string }) =>
      value === values.password ? null : 'Passwords do not match',
  }),
});