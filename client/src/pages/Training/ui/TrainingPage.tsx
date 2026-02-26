import "./TrainingPage.scss";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { planApi, exerciseApi, profileApi } from "@/shared/api";
import type {
  WeekPlanResponse,
  ProfileData,
  Wellbeing,
  TrainingSplit,
  Exercise,
} from "@/shared/api/types";
import { InfoPage } from "@/pages/InfoPage";

interface ApiResponse<T> {
  data?: T;
  total?: number;
}

export function TrainingPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [plan, setPlan] = useState<WeekPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendedSplit, setRecommendedSplit] = useState<
    TrainingSplit | undefined
  >();
  const [splitLoading, setSplitLoading] = useState(true);
  const [splitLoaded, setSplitLoaded] = useState(false);
  const [wellbeing, setWellbeing] = useState<Wellbeing>("normal");

  // ✅ СТРОГАЯ ПАРСИНГ ФУНКЦИЯ
  const parseApiResponse = useCallback((response: unknown): Exercise[] => {
    if (Array.isArray(response)) return response;
    if (response && typeof response === "object" && "data" in response) {
      return (response as ApiResponse<Exercise[]>).data || [];
    }
    return [];
  }, []);

  // ✅ ПРОВЕРКА НЕЗАПОЛНЕННОГО ПРОФИЛЯ
  const isProfileIncomplete = useCallback((profile: ProfileData): boolean => {
    return (
      profile.age === -1 ||
      profile.weight === -1 ||
      profile.height === -1 ||
      profile.goal === null ||
      profile.lifestyle === null
    );
  }, []);

  const getIncompleteFields = useCallback((profile: ProfileData): string => {
    const issues: string[] = [];
    if (profile.age === -1) issues.push("возраст");
    if (profile.weight === -1) issues.push("вес");
    if (profile.height === -1) issues.push("рост");
    if (profile.goal === null) issues.push("цель");
    if (profile.lifestyle === null) issues.push("образ жизни");
    return issues.join(", ");
  }, []);

  const getRecommendedSplit = useCallback(async (): Promise<TrainingSplit> => {
    try {
      const recommendation = await planApi.recommendSplit();
      return recommendation.split || "FULL_BODY";
    } catch {
      return "FULL_BODY";
    }
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    if (!profile || !recommendedSplit) return alert("Загрузи профиль!");

    setLoading(true);
    try {
      const response = await planApi.generatePlan(
        wellbeing,
        1,
        recommendedSplit,
      );
      setPlan(response);
    } catch {
      alert("Ошибка генерации плана");
    } finally {
      setLoading(false);
    }
  }, [profile, recommendedSplit, wellbeing]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🚀 Loading profile...");

        const profileRaw = await profileApi.getProfile();

        const profileData: ProfileData = {
          id: (profileRaw as Partial<ProfileData>).id ?? "temp-id",
          userId: (profileRaw as Partial<ProfileData>).userId ?? "temp-user",
          age: (profileRaw as Partial<ProfileData>).age ?? -1,
          weight: (profileRaw as Partial<ProfileData>).weight ?? -1,
          height: (profileRaw as Partial<ProfileData>).height ?? -1,
          goal: (profileRaw as Partial<ProfileData>).goal ?? null,
          lifestyle: (profileRaw as Partial<ProfileData>).lifestyle ?? null,
          bmi: (profileRaw as Partial<ProfileData>).bmi ?? null,
          bmiCategory:
            (profileRaw as Partial<ProfileData>).bmiCategory ?? "Неизвестно",
          isWeightSet:
            !!(profileRaw as Partial<ProfileData>).weight &&
            (profileRaw as Partial<ProfileData>).weight! > 0,
          isHeightSet:
            !!(profileRaw as Partial<ProfileData>).height &&
            (profileRaw as Partial<ProfileData>).height! > 0,
          isAgeSet:
            !!(profileRaw as Partial<ProfileData>).age &&
            (profileRaw as Partial<ProfileData>).age! > 0,
          isLifestyleSet: !!(profileRaw as Partial<ProfileData>).lifestyle,
          isGoalSet: !!(profileRaw as Partial<ProfileData>).goal,
          createdAt:
            (profileRaw as Partial<ProfileData>).createdAt ??
            new Date().toISOString(),
          updatedAt:
            (profileRaw as Partial<ProfileData>).updatedAt ??
            new Date().toISOString(),
        };

        const exercisesRaw = await exerciseApi.getAll();
        const exercisesData = parseApiResponse(exercisesRaw);

        setProfile(profileData);
        setAllExercises(exercisesData);

        console.log("✅ LOADED:", {
          profile: profileData,
          exercises: exercisesData.length,
        });
      } catch (error) {
        console.error("❌ Load error:", error);
        setProfile({
          id: "fake-id",
          userId: "fake-user",
          age: -1,
          weight: -1,
          height: -1,
          goal: null,
          lifestyle: null,
          bmi: null,
          bmiCategory: "Не заполнено",
          isWeightSet: false,
          isHeightSet: false,
          isAgeSet: false,
          isLifestyleSet: false,
          isGoalSet: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    };

    loadData();
  }, [parseApiResponse]);

  useEffect(() => {
    if (!profile || splitLoaded) return;

    const loadSplit = async () => {
      try {
        setSplitLoading(true);
        const split = await getRecommendedSplit();
        setRecommendedSplit(split);
        setSplitLoaded(true);
      } catch {
        setRecommendedSplit("FULL_BODY");
        setSplitLoaded(true);
      } finally {
        setSplitLoading(false);
      }
    };

    loadSplit();
  }, [profile, splitLoaded, getRecommendedSplit]);

  const getExerciseName = useCallback(
    (exerciseId: string): string => {
      const exercise = allExercises.find((ex) => ex.id === exerciseId);
      return (
        exercise?.name || exerciseId.slice(0, 8) || "Неизвестное упражнение"
      );
    },
    [allExercises],
  );

  // ✅ ЛОГИКА РЕНДЕРА
  if (!profile) return <InfoPage type="loading" />;

  if (isProfileIncomplete(profile)) {
    return (
      <div className="training-page training-page--incomplete">
        <div className="training-page__container">
          <div className="training-page__error-section">
            <h1 className="training-page__error-title">
              СНАЧАЛА ЗАПОЛНИТЕ ДАННЫЕ В ПРОФИЛЕ
            </h1>
            <p className="training-page__error-text">
              Не заполнены: {getIncompleteFields(profile)}
            </p>
            <button
              className="training-page__profile-link"
              onClick={() => navigate("/dashboard")}>
              Перейти в профиль →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="training-page">
      <div className="training-page__container">
        <h1 className="training-page__title">Твой тренировочный план</h1>

        <div className="training-page__profile">
          <div className="training-page__profile-row">
            <span className="training-page__profile-label">Возраст:</span>
            <span className="training-page__profile-value">{profile.age}</span>
          </div>
          <div className="training-page__profile-row">
            <span className="training-page__profile-label">Вес:</span>
            <span className="training-page__profile-value">
              {profile.weight} кг
            </span>
          </div>
          <div className="training-page__profile-row">
            <span className="training-page__profile-label">Рост:</span>
            <span className="training-page__profile-value">
              {profile.height} см
            </span>
          </div>
          <div className="training-page__profile-row">
            <span className="training-page__profile-label">Цель:</span>
            <span className="training-page__profile-value">{profile.goal}</span>
          </div>
          <div className="training-page__profile-row">
            <span className="training-page__profile-label">Образ жизни:</span>
            <span className="training-page__profile-value">
              {profile.lifestyle}
            </span>
          </div>
        </div>

        {/* ✅ КНОПКА ТОЛЬКО БЕЗ ПЛАНА + LOADING */}
        {!plan && (
          <div className="training-page__generate-section">
            <button
              className="training-page__generate-btn"
              onClick={handleGeneratePlan}
              disabled={loading || splitLoading}>
              {loading ? "Создание плана..." : "Создать индивидуальный план"}
            </button>
          </div>
        )}

        {/* ✅ КРАСИВЫЙ ПЛАН ТРЕНИРОВОК */}
        {plan && (
          <div className="training-page__plan">
            <div className="training-page__plan-header">
              <h2 className="training-page__plan-title">
                Неделя {plan.week} • {plan.split}
              </h2>
              <div className="training-page__plan-score">
                Оценка: {plan.score}/100
                {plan.wellbeingAdjusted && (
                  <span className="training-page__plan-badge">
                    🌡️ Адаптировано
                  </span>
                )}
              </div>
            </div>

            <div className="training-page__days-grid">
              {Object.entries(plan.days).map(([dayNum, day]) => (
                <div key={dayNum} className="training-page__day-card">
                  <div className="training-page__day-header">
                    <span className="training-page__day-number">
                      День {day.day}
                    </span>
                    <span
                      className={`training-page__day-type training-page__day-type--${day.type.toLowerCase()}`}>
                      {day.type}
                    </span>
                  </div>

                  <div className="training-page__exercises">
                    {day.exercises.map((exercise, idx) => (
                      <div key={idx} className="training-page__exercise">
                        <div className="training-page__exercise-name">
                          {getExerciseName(exercise.exerciseId)}
                        </div>
                        <div className="training-page__exercise-details">
                          <span className="training-page__sets-reps">
                            {exercise.sets} × {exercise.progression.baseReps[0]}
                            -{exercise.progression.baseReps[1]}
                          </span>
                          {exercise.favorite && (
                            <span className="training-page__favorite">⭐</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="training-page__plan-footer">
              <span>Дни отдыха: {plan.restDays.join(", ")}</span>
              <span>Самочувствие: {plan.wellbeing}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
