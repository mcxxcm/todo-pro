import { useFirebaseTasks } from "@/providers/firebaseProvider";
import { useAuth } from "@/providers/AuthContext";
import { useLocalTasks } from "@/hooks/useLocalTasks";

export function useTasks() {
  const { loading: authLoading, user } = useAuth();
  const firebaseTasks = useFirebaseTasks();
  const localTasks = useLocalTasks();

  if (authLoading) {
    return {
      ...localTasks,
      error: null,
      loading: true,
      tasks: [],
    };
  }

  return user ? firebaseTasks : localTasks;
}
