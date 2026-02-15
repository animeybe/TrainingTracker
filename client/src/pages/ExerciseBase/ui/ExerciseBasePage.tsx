import type { ExerciseListResponse } from "@/types/exercise.types";
import { exerciseApi } from "@/shared/api/authApi";
import "./ExerciseBasePage.scss";
import { useEffect, useState } from "react";

export function ExerciseBasePage() {
  const [exercises, setExercises] = useState<string[]>([]);

  useEffect(() => {
    exerciseApi
      .getAll()
      .then((response: ExerciseListResponse) => {
        const names = response.data.map((exercise) => exercise.name);
        setExercises(names);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <div>
        <h2>Все упражнения ({exercises.length})</h2>
        <ul>
          {exercises.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
