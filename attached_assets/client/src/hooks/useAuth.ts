import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // For development with disabled authentication, always return authenticated
  // if we have any user data (including mock data)
  return {
    user: user || {
      id: "44276721",
      email: "ottmar.francisca1969@gmail.com",
      firstName: "Ottmar",
      lastName: "Francisca"
    },
    isLoading,
    isAuthenticated: true, // Always authenticated in development mode
  };
}
