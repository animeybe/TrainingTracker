export interface ProfileData {
id: string;
  userId: string;
  weight?: number;
  height?: number;
  age?: number;
  lifestyle?: string | null;
  goal?: string | null;
  bmi: number;
  bmiCategory: string;
}
