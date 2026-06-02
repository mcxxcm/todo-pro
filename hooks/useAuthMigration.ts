import { useEffect, useRef } from "react";
import { collection, doc, getCountFromServer, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthContext";
import { loadTasks, clearTasks } from "@/lib/taskStorage";

const BATCH_LIMIT = 500;

export function useAuthMigration() {
  const { user, loading } = useAuth();
  const migratedRef = useRef(false);

  useEffect(() => {
    if (loading || !user || migratedRef.current) return;

    async function migrate() {
      try {
        const tasksRef = collection(db, "users", user!.uid, "tasks");
        const cloudSnapshot = await getCountFromServer(tasksRef);
        if (cloudSnapshot.data().count > 0) {
          migratedRef.current = true;
          return;
        }

        const localTasks = await loadTasks();
        if (localTasks.length === 0) {
          migratedRef.current = true;
          return;
        }

        for (let i = 0; i < localTasks.length; i += BATCH_LIMIT) {
          const batch = writeBatch(db);
          const chunk = localTasks.slice(i, i + BATCH_LIMIT);
          for (const task of chunk) {
            const taskRef = doc(tasksRef, task.id);
            batch.set(taskRef, task);
          }
          await batch.commit();
        }

        await clearTasks();
        migratedRef.current = true;
        console.log(`[auth-migration] Migrated ${localTasks.length} local tasks to Firestore`);
      } catch (e) {
        console.error("[auth-migration] Failed to migrate local tasks:", e);
      }
    }

    void migrate();
  }, [user, loading]);
}
