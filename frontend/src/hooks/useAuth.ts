'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const router = useRouter();
  const { setAuth, clearAuth, user, token, isAuthenticated } = useAuthStore();

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success('Welcome to RideShare! 🚗');
      router.push(user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/rider');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Registration failed');
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      router.push(user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/rider');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Login failed');
    },
  });

  const logout = () => {
    clearAuth();
    toast('Logged out', { icon: '👋' });
    router.push('/login');
  };

  return {
    user,
    token,
    isAuthenticated,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
  };
}
