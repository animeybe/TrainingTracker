// @/shared/ui/blocks/ProfileEditModal.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import type { ProfileData } from "@/shared/api/types";
import type { SafeUser } from "@/types/auth.types";
import { authApi } from "@/shared/api";
import EyeIcon from "@/assets/icon/eye.svg";
import "./ProfileEditModal.scss";
import { profileApi } from "@/shared/api/profileApi";

// ==================== TYPES ====================
type TabKey = "profile" | "account";
type AccountSubTab = "login-email" | "password";
type SubmitStatus = "idle" | "success" | "error";

interface FormProfileData {
  weight: string;
  height: string;
  age: string;
  lifestyle: string;
  goal: string;
  gender: string;
}

interface LoginEmailData {
  login: string;
  email: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface BaseErrors {
  general?: string;
  [key: string]: string | undefined;
}

type ProfileErrors = BaseErrors;
type LoginEmailErrors = BaseErrors;
type PasswordErrors = BaseErrors;

interface CaptchaQuestion {
  num1: number;
  num2: number;
  answer: number;
}

interface ProfileEditModalProps {
  profile: ProfileData | null;
  user: SafeUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ==================== CONSTANTS ====================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INITIAL_PROFILE_DATA: FormProfileData = {
  weight: "",
  height: "",
  age: "",
  lifestyle: "",
  goal: "",
  gender: "",
};

const INITIAL_LOGIN_EMAIL_DATA: LoginEmailData = {
  login: "",
  email: "",
};

const INITIAL_PASSWORD_DATA: PasswordData = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const INITIAL_CAPTCHA_QUESTION: CaptchaQuestion = {
  num1: 0,
  num2: 0,
  answer: 0,
};

// ==================== MAIN COMPONENT ====================
export function ProfileEditModal({
  profile,
  user,
  isOpen,
  onClose,
  onSuccess,
}: ProfileEditModalProps) {
  // Tab states
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [loginEmailTab, setLoginEmailTab] =
    useState<AccountSubTab>("login-email");

  // Form states
  const [profileData, setProfileData] =
    useState<FormProfileData>(INITIAL_PROFILE_DATA);
  const [loginEmailData, setLoginEmailData] = useState<LoginEmailData>(
    INITIAL_LOGIN_EMAIL_DATA,
  );
  const [passwordData, setPasswordData] = useState<PasswordData>(
    INITIAL_PASSWORD_DATA,
  );

  // UI states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  // Error states
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [loginEmailErrors, setLoginEmailErrors] = useState<LoginEmailErrors>(
    {},
  );
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

  // Captcha states
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState<CaptchaQuestion>(
    INITIAL_CAPTCHA_QUESTION,
  );

  // Refs
  const submitTimeoutRef = useRef<number | null>(null);

  // ==================== EFFECTS ====================

  // 3. Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    if (isOpen && user?.id) {
      console.log("🎯 MODAL OPEN:", {
        userId: user.id,
        userEmail: user.email, // ← ВОТ ТВОЙ EMAIL!
        userLogin: user.login,
      });

      // ✅ СРАЗУ устанавливаем данные из props (без getMe!)
      setLoginEmailData({
        login: user.login || "",
        email: user.email ?? "", // null → ""
      });

      console.log("📧 EMAIL SET:", user.email ?? ""); // ✅ Лог результата

      // Остальная инициализация...
      setProfileData({
        weight: profile?.weight === -1 ? "" : profile?.weight?.toString() || "",
        height: profile?.height === -1 ? "" : profile?.height?.toString() || "",
        age: profile?.age === -1 ? "" : profile?.age?.toString() || "",
        lifestyle: profile?.lifestyle || "",
        goal: profile?.goal || "",
        gender: profile?.gender || "",
      });

      // Остальная инициализация
      setPasswordData(INITIAL_PASSWORD_DATA);
      setProfileErrors({});
      setLoginEmailErrors({});
      setPasswordErrors({});
      setSubmitStatus("idle");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setCaptchaValue("");
      setCaptchaSolved(false);
      setCaptchaQuestion(INITIAL_CAPTCHA_QUESTION);
    }
  }, [isOpen, user?.id, user?.login, user?.email]);

  // ==================== VALIDATORS ====================
  const validateProfileField = useCallback(
    (field: keyof FormProfileData, value: string): string | null => {
      const num = Number(value);

      switch (field) {
        case "weight":
          return value && (isNaN(num) || num < 20 || num > 300)
            ? "Вес: 20-300 кг"
            : null;
        case "height":
          return value && (isNaN(num) || num < 100 || num > 250)
            ? "Рост: 100-250 см"
            : null;
        case "age":
          return value && (isNaN(num) || num < 7 || num > 150)
            ? "Возраст: 7-150 лет"
            : null;
        default:
          return null;
      }
    },
    [],
  );

  const validateLoginEmailField = useCallback(
    (field: keyof LoginEmailData, value: string): string | null => {
      switch (field) {
        case "login":
          return value && (value.length < 3 || value.length > 20)
            ? "Логин: 3-20 символов"
            : null;
        case "email":
          return value && !EMAIL_REGEX.test(value) ? "Неверный email" : null;
        default:
          return null;
      }
    },
    [],
  );

  const validatePasswordField = useCallback(
    (
      field: keyof PasswordData,
      value: string,
      newPassword: string,
    ): string | null => {
      switch (field) {
        case "currentPassword":
        case "newPassword":
          return value && value.length < 8 ? "Минимум 8 символов" : null;
        case "confirmNewPassword":
          return value !== newPassword ? "Пароли не совпадают" : null;
        default:
          return null;
      }
    },
    [],
  );

  // ==================== EVENT HANDLERS ====================
  const updateFieldError = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<BaseErrors>>,
      field: string,
      error: string | null,
    ) => {
      setter((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    },
    [],
  );

  const handleProfileChange = useCallback(
    (field: keyof FormProfileData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        const error = validateProfileField(field, value);

        updateFieldError(setProfileErrors, field as string, error);
        setProfileData((prev) => ({ ...prev, [field]: value }));
      },
    [validateProfileField, updateFieldError],
  );

  const handleLoginEmailChange = useCallback(
    (field: keyof LoginEmailData) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const error = validateLoginEmailField(field, value);

        updateFieldError(setLoginEmailErrors, field as string, error);
        setLoginEmailData((prev) => ({ ...prev, [field]: value }));
      },
    [validateLoginEmailField, updateFieldError],
  );

  const handlePasswordChange = useCallback(
    (field: keyof PasswordData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const error = validatePasswordField(
        field,
        value,
        passwordData.newPassword,
      );

      updateFieldError(setPasswordErrors, field as string, error);
      setPasswordData((prev) => ({ ...prev, [field]: value }));
    },
    [validatePasswordField, passwordData.newPassword, updateFieldError],
  );

  const togglePasswordVisibility = useCallback(
    (field: "currentPassword" | "newPassword" | "confirmNewPassword") => {
      switch (field) {
        case "currentPassword":
          setShowCurrentPassword((prev) => !prev);
          break;
        case "newPassword":
          setShowNewPassword((prev) => !prev);
          break;
        case "confirmNewPassword":
          setShowConfirmPassword((prev) => !prev);
          break;
      }
    },
    [],
  );

  const generateCaptcha = useCallback(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;

    setCaptchaQuestion({ num1, num2, answer: num1 + num2 });
    setCaptchaValue("");
    setCaptchaSolved(false);
  }, []);

  const handleCaptchaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCaptchaValue(value);
      setCaptchaSolved(Number(value) === captchaQuestion.answer);
    },
    [captchaQuestion.answer],
  );

  // ==================== DATA PREPARATION ====================
  const prepareProfileData = useCallback((): Record<
    string,
    number | string
  > => {
    const updateData: Record<string, number | string> = {};

    const weightNum = Number(profileData.weight);
    if (profileData.weight && !isNaN(weightNum)) updateData.weight = weightNum;

    const heightNum = Number(profileData.height);
    if (profileData.height && !isNaN(heightNum)) updateData.height = heightNum;

    const ageNum = Number(profileData.age);
    if (profileData.age && !isNaN(ageNum)) updateData.age = ageNum;

    if (profileData.lifestyle) updateData.lifestyle = profileData.lifestyle;
    if (profileData.goal) updateData.goal = profileData.goal;
    if (profileData.gender) updateData.gender = profileData.gender;

    return updateData;
  }, [profileData]);

  const prepareLoginEmailData = useCallback(() => {
    const updateData: Record<string, string> = {};
    const originalLogin = user.login || "";
    const originalEmail = user.email ?? "";

    if (loginEmailData.login.trim() !== originalLogin) {
      updateData.login = loginEmailData.login.trim();
    }

    // ✅ "" вместо null - сервер поймет
    if (loginEmailData.email !== originalEmail) {
      updateData.email = loginEmailData.email || ""; // "" → ""
    }

    return updateData;
  }, [loginEmailData.email, loginEmailData.login, user.login, user.email]);

  const preparePasswordData = useCallback((): Record<string, string> => {
    const updateData: Record<string, string> = {};

    if (passwordData.currentPassword) {
      updateData.currentPassword = passwordData.currentPassword;
    }
    if (passwordData.newPassword) {
      updateData.newPassword = passwordData.newPassword;
    }

    return updateData;
  }, [passwordData]);

  // ==================== SUBMIT HANDLER ====================
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      if (activeTab === "profile") {
        const profileUpdate = prepareProfileData();
        if (Object.keys(profileUpdate).length === 0) {
          onClose();
          return;
        }

        console.log("📝 Profile update:", profileUpdate);
        const updatedProfile = await profileApi.update(profileUpdate);
        console.log("✅ Profile updated:", updatedProfile);
      } else {
        if (loginEmailTab === "login-email") {
          const accountUpdate = prepareLoginEmailData();
          if (Object.keys(accountUpdate).length === 0) {
            onClose();
            return;
          }
          await authApi.updateAccount(accountUpdate);
        } else {
          if (!captchaSolved) {
            setPasswordErrors((prev) => ({
              ...prev,
              general: "✅ Решите капчу",
            }));
            return;
          }

          const passwordUpdate = preparePasswordData();
          if (Object.keys(passwordUpdate).length === 0) {
            onClose();
            return;
          }
          await authApi.updateAccount(passwordUpdate);
        }
      }

      setSubmitStatus("success");
      submitTimeoutRef.current = setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (error: unknown) {
      console.error("❌ Submit error:", error);

      // Показываем ошибку пользователю
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка сохранения";
      if (activeTab === "profile") {
        setProfileErrors({ general: errorMessage });
      } else if (loginEmailTab === "login-email") {
        setLoginEmailErrors({ general: errorMessage });
      } else {
        setPasswordErrors({ general: errorMessage });
      }
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activeTab,
    loginEmailTab,
    isSubmitting,
    captchaSolved,
    prepareProfileData,
    prepareLoginEmailData,
    preparePasswordData,
    onClose,
    onSuccess,
  ]);

  const handleGenderChange = useCallback(
    (value: string) => {
      setProfileData((prev) => ({ ...prev, gender: value }));
      if (profileErrors.gender) {
        updateFieldError(setProfileErrors, "gender", null);
      }
    },
    [updateFieldError],
  );

  const handleAccountTabClick = useCallback(() => {
    setActiveTab("account");
    setLoginEmailTab("login-email");
  }, []);

  // Early return
  if (!isOpen) return null;

  // ==================== JSX ====================
  return (
    <div className="profile-edit-modal__overlay" onClick={onClose}>
      <div
        className="profile-edit-modal__content"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-edit-modal__header">
          <h2 className="profile-edit-modal__title">Редактировать профиль</h2>
          <button
            className="profile-edit-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Закрыть модальное окно">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="profile-edit-modal__tabs">
          <button
            className={`profile-edit-modal__tab-btn profile-edit-modal__tab-btn_profile ${activeTab === "profile" ? "profile-edit-modal__tab-btn--active" : ""}`}
            onClick={() => setActiveTab("profile")}
            disabled={isSubmitting}>
            Физические данные
          </button>
          <button
            className={`profile-edit-modal__tab-btn profile-edit-modal__tab-btn_account ${activeTab === "account" ? "profile-edit-modal__tab-btn--active" : ""}`}
            onClick={handleAccountTabClick}
            disabled={isSubmitting}>
            Настройки аккаунта
          </button>
        </div>

        {/* Body */}
        <div className="profile-edit-modal__body">
          {activeTab === "profile" && (
            <div className="profile-data-form">
              <h3 className="profile-data-form__title">Физические данные</h3>

              {profileErrors.general && (
                <div className="profile-data-form__error">
                  {profileErrors.general}
                </div>
              )}
              {submitStatus === "success" && (
                <div className="profile-data-form__success">
                  ✅ Данные сохранены
                </div>
              )}

              {/* Profile fields grid */}
              <div className="profile-data-form__grid">
                <div
                  className={`profile-data-form__group ${profileErrors.weight ? "profile-data-form__group--error" : ""}`}>
                  <label htmlFor="weight">Вес (кг)</label>
                  <input
                    id="weight"
                    type="number"
                    min="20"
                    max="300"
                    step="0.1"
                    placeholder="- Укажите ваш вес -"
                    value={profileData.weight}
                    onChange={handleProfileChange("weight")}
                    disabled={isSubmitting}
                  />
                  {profileErrors.weight && (
                    <span className="profile-data-form__error-message">
                      {profileErrors.weight}
                    </span>
                  )}
                </div>

                <div
                  className={`profile-data-form__group ${profileErrors.height ? "profile-data-form__group--error" : ""}`}>
                  <label htmlFor="height">Рост (см)</label>
                  <input
                    id="height"
                    type="number"
                    min="100"
                    max="250"
                    step="1"
                    placeholder="- Укажите ваш рост -"
                    value={profileData.height}
                    onChange={handleProfileChange("height")}
                    disabled={isSubmitting}
                  />
                  {profileErrors.height && (
                    <span className="profile-data-form__error-message">
                      {profileErrors.height}
                    </span>
                  )}
                </div>

                <div
                  className={`profile-data-form__group ${profileErrors.age ? "profile-data-form__group--error" : ""}`}>
                  <label htmlFor="age">Возраст (лет)</label>
                  <input
                    id="age"
                    type="number"
                    min="7"
                    max="150"
                    step="1"
                    placeholder="- Укажите ваш возраст -"
                    value={profileData.age}
                    onChange={handleProfileChange("age")}
                    disabled={isSubmitting}
                  />
                  {profileErrors.age && (
                    <span className="profile-data-form__error-message">
                      {profileErrors.age}
                    </span>
                  )}
                </div>
              </div>

              <div className="profile-data-form__group profile-data-form__group--full-width">
                <label>Пол</label>
                <div className="gender-toggle">
                  <button
                    type="button"
                    className={`gender-toggle__btn ${profileData.gender === "Male" ? "gender-toggle__btn--active" : ""}`}
                    onClick={() => handleGenderChange("Male")}>
                    ♂ Мужской
                  </button>
                  <button
                    type="button"
                    className={`gender-toggle__btn ${profileData.gender === "Female" ? "gender-toggle__btn--active" : ""}`}
                    onClick={() => handleGenderChange("Female")}>
                    ♀ Женский
                  </button>
                </div>
              </div>

              {/* Selects grid */}
              <div className="profile-data-form__grid">
                <div className="profile-data-form__group profile-data-form__group--full-width">
                  <label htmlFor="lifestyle">Образ жизни</label>
                  <select
                    id="lifestyle"
                    value={profileData.lifestyle}
                    onChange={handleProfileChange("lifestyle")}
                    disabled={isSubmitting}>
                    <option value="">Не выбран</option>
                    <option value="IMMOBILE">Сидячий</option>
                    <option value="LIGHT">Лёгкая активность</option>
                    <option value="AVERAGE">Умеренная активность</option>
                    <option value="HARD">Высокая активность</option>
                  </select>
                </div>

                <div className="profile-data-form__group profile-data-form__group--full-width">
                  <label htmlFor="goal">Цель</label>
                  <select
                    id="goal"
                    value={profileData.goal}
                    onChange={handleProfileChange("goal")}
                    disabled={isSubmitting}>
                    <option value="">Не выбрана</option>
                    <option value="LOSE_FAT">Сбросить жир</option>
                    <option value="MAINTAIN_WEIGHT">Поддерживать вес</option>
                    <option value="GAIN_MUSCLE_MASS">Набрать мышцы</option>
                    <option value="STRENGTH">Силовой рост</option>
                    <option value="HYPERTROPHY">Гипертрофия</option>
                    <option value="ENDURANCE">Выносливость</option>
                    <option value="POWER">Силовая выносливость</option>
                    <option value="HEALTH">Улучшение здоровья</option>
                    <option value="REHABILITATION">Реабилитация</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="profile-data-form__footer">
                <button
                  className="profile-data-form__btn profile-data-form__btn--secondary"
                  onClick={onClose}
                  disabled={isSubmitting}>
                  Отмена
                </button>
                <button
                  className={`profile-data-form__btn profile-data-form__btn--primary ${isSubmitting ? "profile-data-form__btn--loading" : ""}`}
                  onClick={handleSubmit}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="profile-data-form__spinner"></span>{" "}
                      Сохранение...
                    </>
                  ) : (
                    "Сохранить данные"
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="account-settings">
              {/* Account sub-tabs */}
              <div className="account-settings__tabs">
                <button
                  className={`account-settings__tab-btn ${loginEmailTab === "login-email" ? "account-settings__tab-btn--active" : ""}`}
                  onClick={() => setLoginEmailTab("login-email")}
                  disabled={isSubmitting}>
                  Логин и почта
                </button>
                <button
                  className={`account-settings__tab-btn ${loginEmailTab === "password" ? "account-settings__tab-btn--active" : ""}`}
                  onClick={() => {
                    setLoginEmailTab("password");
                    generateCaptcha();
                  }}
                  disabled={isSubmitting}>
                  Сменить пароль
                </button>
              </div>

              {loginEmailTab === "login-email" && (
                <div className="login-email-form">
                  <h3 className="login-email-form__title">Логин и email</h3>

                  {loginEmailErrors.general && (
                    <div className="login-email-form__error">
                      {loginEmailErrors.general}
                    </div>
                  )}
                  {submitStatus === "success" && (
                    <div className="login-email-form__success">
                      ✅ Данные сохранены
                    </div>
                  )}

                  <div className="login-email-form__grid">
                    <div
                      className={`login-email-form__group ${loginEmailErrors.login ? "login-email-form__group--error" : ""}`}>
                      <label htmlFor="login">Логин</label>
                      <input
                        id="login"
                        type="text"
                        placeholder="Новый логин"
                        value={loginEmailData.login}
                        onChange={handleLoginEmailChange("login")}
                        disabled={isSubmitting}
                      />
                      {loginEmailErrors.login && (
                        <span className="login-email-form__error-message">
                          {loginEmailErrors.login}
                        </span>
                      )}
                    </div>

                    <div
                      className={`login-email-form__group ${loginEmailErrors.email ? "login-email-form__group--error" : ""}`}>
                      <label htmlFor="email">Email (необязательно)</label>
                      <input
                        id="email"
                        type="email"
                        placeholder={"example@mail.com"}
                        value={loginEmailData.email}
                        onChange={handleLoginEmailChange("email")}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="account-settings__footer">
                    <button
                      className="account-settings__btn account-settings__btn--secondary"
                      onClick={onClose}
                      disabled={isSubmitting}>
                      Отмена
                    </button>
                    <button
                      className={`account-settings__btn account-settings__btn--primary ${isSubmitting ? "account-settings__btn--loading" : ""}`}
                      onClick={handleSubmit}
                      disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="account-settings__spinner"></span>{" "}
                          Сохранение...
                        </>
                      ) : (
                        "Сохранить изменения"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {loginEmailTab === "password" && (
                <div className="password-change-form">
                  <h3 className="password-change-form__title">Смена пароля</h3>

                  {passwordErrors.general && (
                    <div className="password-change-form__error">
                      {passwordErrors.general}
                    </div>
                  )}

                  <div className="password-change-form__grid">
                    {/* Current password */}
                    <div
                      className={`password-change-form__group password-change-form__group--full-width ${passwordErrors.currentPassword ? "password-change-form__group--error" : ""}`}>
                      <label htmlFor="currentPassword">Текущий пароль</label>
                      <div className="password-change-form__input-wrapper">
                        <input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Текущий пароль"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange("currentPassword")}
                          disabled={isSubmitting}
                          className="password-change-form__input"
                        />
                        <button
                          type="button"
                          className="password-change-form__toggle"
                          onClick={() =>
                            togglePasswordVisibility("currentPassword")
                          }
                          tabIndex={-1}
                          aria-label={
                            showCurrentPassword
                              ? "Скрыть пароль"
                              : "Показать пароль"
                          }>
                          <img
                            src={EyeIcon}
                            alt="Переключить видимость пароля"
                          />
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <span className="password-change-form__error-message">
                          {passwordErrors.currentPassword}
                        </span>
                      )}
                    </div>

                    {/* New password */}
                    <div
                      className={`password-change-form__group password-change-form__group--full-width ${passwordErrors.newPassword ? "password-change-form__group--error" : ""}`}>
                      <label htmlFor="newPassword">Новый пароль</label>
                      <div className="password-change-form__input-wrapper">
                        <input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Минимум 8 символов"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange("newPassword")}
                          disabled={isSubmitting}
                          className="password-change-form__input"
                        />
                        <button
                          type="button"
                          className="password-change-form__toggle"
                          onClick={() =>
                            togglePasswordVisibility("newPassword")
                          }
                          tabIndex={-1}
                          aria-label={
                            showNewPassword
                              ? "Скрыть пароль"
                              : "Показать пароль"
                          }>
                          <img
                            src={EyeIcon}
                            alt="Переключить видимость пароля"
                          />
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <span className="password-change-form__error-message">
                          {passwordErrors.newPassword}
                        </span>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div
                      className={`password-change-form__group password-change-form__group--full-width ${passwordErrors.confirmNewPassword ? "password-change-form__group--error" : ""}`}>
                      <label htmlFor="confirmNewPassword">
                        Подтвердить пароль
                      </label>
                      <div className="password-change-form__input-wrapper">
                        <input
                          id="confirmNewPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Повторите новый пароль"
                          value={passwordData.confirmNewPassword}
                          onChange={handlePasswordChange("confirmNewPassword")}
                          disabled={isSubmitting}
                          className="password-change-form__input"
                        />
                        <button
                          type="button"
                          className="password-change-form__toggle"
                          onClick={() =>
                            togglePasswordVisibility("confirmNewPassword")
                          }
                          tabIndex={-1}
                          aria-label={
                            showConfirmPassword
                              ? "Скрыть пароль"
                              : "Показать пароль"
                          }>
                          <img
                            src={EyeIcon}
                            alt="Переключить видимость пароля"
                          />
                        </button>
                      </div>
                      {passwordErrors.confirmNewPassword && (
                        <span className="password-change-form__error-message">
                          {passwordErrors.confirmNewPassword}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Captcha */}
                  <div className="captcha-section">
                    <h4 className="captcha-section__title">
                      Для сохранения решите пример
                    </h4>
                    <div className="captcha-section__container">
                      <div className="captcha-section__question">
                        Сколько будет {captchaQuestion.num1} +{" "}
                        {captchaQuestion.num2}?
                      </div>
                      <div
                        className={`captcha-section__group ${captchaValue && !captchaSolved ? "captcha-section__group--error" : ""}`}>
                        <label>Ответ</label>
                        <input
                          type="number"
                          placeholder="?"
                          value={captchaValue}
                          onChange={handleCaptchaChange}
                          disabled={isSubmitting}
                          className={
                            captchaSolved
                              ? "captcha-section__input--success"
                              : ""
                          }
                        />
                        {captchaValue && !captchaSolved && (
                          <span className="captcha-section__error-message">
                            Неверно
                          </span>
                        )}
                        {captchaSolved && (
                          <span className="captcha-section__success-message">
                            ✅ Правильно
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="account-settings__footer">
                    <button
                      className="account-settings__btn account-settings__btn--secondary"
                      onClick={onClose}
                      disabled={isSubmitting}>
                      Отмена
                    </button>
                    <button
                      className={`account-settings__btn account-settings__btn--primary ${isSubmitting ? "account-settings__btn--loading" : ""}`}
                      onClick={handleSubmit}
                      disabled={isSubmitting || !captchaSolved}>
                      {isSubmitting ? (
                        <>
                          <span className="account-settings__spinner"></span>{" "}
                          Сохранение...
                        </>
                      ) : (
                        "Сохранить изменения"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
