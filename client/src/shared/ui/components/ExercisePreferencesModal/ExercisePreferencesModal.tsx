  // shared/ui/components/ExercisePreferencesModal/ExercisePreferencesModal.tsx
  import type { Exercise } from "@/shared/api/types";
  import "./ExercisePreferencesModal.scss";
  import { PRIMARY_MUSCLE_GROUP_RU } from "@/pages/ExerciseBase/common/utils/muscleGroupInterpreter";
  import { useEffect, useRef, useState } from "react";

  type Props = {
    favoriteExercises: Exercise[];
    leastFavoriteExercises: Exercise[];
    isLoading: boolean;
    onClose: () => void;
  };

  export function ExercisePreferencesModal({
    favoriteExercises,
    leastFavoriteExercises,
    isLoading,
    onClose,
  }: Props) {
    const listRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);

    // Позиция ползунка
    const [thumbY, setThumbY] = useState(0);

    // Высота ползунка скролла
    const thumbHeight = 140;

    // Синхронизация ползунка со scroll
    useEffect(() => {
      const list = listRef.current;
      if (!list) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = list;
        const contentHeight = scrollHeight - clientHeight;
        const thumbRange = clientHeight - thumbHeight;

        const thumbY =
          contentHeight > 0 ? (scrollTop / contentHeight) * thumbRange : 0;

        setThumbY(thumbY);
      };

      list.addEventListener("scroll", handleScroll);
      handleScroll();

      return () => list.removeEventListener("scroll", handleScroll);
    }, []);

    // Перетягивание ползунка мышью/пальцем
    useEffect(() => {
      const list = listRef.current;
      const thumb = thumbRef.current;
      if (!list || !thumb) return;

      let isDragging = false;

      const getThumbY = (y: number): number => {
        const scrollbarRect = thumb.parentElement!.getBoundingClientRect();
        const maxThumbY = scrollbarRect.height - thumbHeight;

        let relativeY = y - scrollbarRect.top;

        if (relativeY < 0) relativeY = 0;
        if (relativeY > maxThumbY) relativeY = maxThumbY;

        return relativeY;
      };

      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        isDragging = true;
      };

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        isDragging = true;
      };

      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        const currentY =
          e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        const y = getThumbY(currentY);

        const listHeight = list.clientHeight;
        const contentHeight = list.scrollHeight - listHeight;

        if (contentHeight <= 0) return;

        const scrollTop = (y / (listHeight - thumbHeight)) * contentHeight;
        list.scrollTop = scrollTop;
      };

      const handleMouseUp = () => {
        isDragging = false;
      };

      thumb.addEventListener("mousedown", handleMouseDown);
      thumb.addEventListener("touchstart", handleTouchStart);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleMouseMove, { passive: false });
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleMouseUp);

      return () => {
        thumb.removeEventListener("mousedown", handleMouseDown);
        thumb.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("touchmove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }, []);

    return (
      <div className="preferences-modal-overlay" onClick={onClose}>
        <div className="preferences-modal" onClick={(e) => e.stopPropagation()}>
          <div className="preferences-modal__header">
            <h2 className="preferences-modal__title">Ваши предпочтения</h2>
            <button
              className="preferences-modal__close"
              onClick={onClose}
              title="Закрыть"
              type="button">
              ×
            </button>
          </div>

          <div className="preferences-modal__content">
            <div ref={listRef} className="preferences-modal__scroll-container">
              {isLoading ? (
                <div className="preferences-modal__loading">🔄 Загружаем...</div>
              ) : (
                <>
                  {/* ❤️ ИЗБРАННОЕ */}
                  <section className="preferences-section">
                    <h3 className="preferences-section__title">❤️ Избранное</h3>
                    {favoriteExercises.length === 0 ? (
                      <div className="preferences-section__empty">
                        Добавьте упражнения в избранное
                      </div>
                    ) : (
                      <ul className="preferences-section__list">
                        {favoriteExercises.map((exercise) => (
                          <li key={exercise.id} className="preferences-item">
                            <span className="preferences-item__name">
                              {exercise.name}
                            </span>
                            <span className="preferences-item__muscle">
                              (
                              {
                                PRIMARY_MUSCLE_GROUP_RU[
                                  exercise.primaryMuscleGroup
                                ]
                              }
                              )
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {/* ❌ НЕЛЮБИМОЕ */}
                  <section className="preferences-section">
                    <h3 className="preferences-section__title">❌ Нелюбимое</h3>
                    {leastFavoriteExercises.length === 0 ? (
                      <div className="preferences-section__empty">
                        Добавьте упражнения в нелюбимое
                      </div>
                    ) : (
                      <ul className="preferences-section__list">
                        {leastFavoriteExercises.map((exercise) => (
                          <li key={exercise.id} className="preferences-item">
                            <span className="preferences-item__name">
                              {exercise.name}
                            </span>
                            <span className="preferences-item__muscle">
                              (
                              {
                                PRIMARY_MUSCLE_GROUP_RU[
                                  exercise.primaryMuscleGroup
                                ]
                              }
                              )
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className="preferences-modal__custom-scrollbar">
              <div
                ref={thumbRef}
                className="preferences-modal__scroll-thumb"
                style={{
                  transform: `translateY(${thumbY}px)`,
                  height: `${thumbHeight}px`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
