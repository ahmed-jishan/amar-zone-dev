// ── Health Feature Types ──

export interface BMIRecord {
  id: string
  weightKg: number
  heightCm: number
  bmi: number
  category: BMICategory
  date: number
}

export type BMICategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese'

export interface BMICategoryInfo {
  category: BMICategory
  label: string
  range: string
  color: string
  gradient: string
  icon: string
  adviceTitle: string
  advice: string[]
  recommendations: string[]
}

export const BMI_CATEGORIES: Record<BMICategory, BMICategoryInfo> = {
  underweight: {
    category: 'underweight',
    label: 'Underweight',
    range: '< 18.5',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    icon: '⚠️',
    adviceTitle: 'Focus on Nutritional Gain',
    advice: [
      'Your BMI indicates you may be underweight for your height.',
      'Consider consulting a nutritionist for a personalized meal plan.',
      'Focus on nutrient-dense foods with healthy calories.',
    ],
    recommendations: [
      'Eat more frequent, smaller meals throughout the day',
      'Incorporate healthy fats like avocados, nuts, and olive oil',
      'Include protein-rich foods: eggs, fish, legumes, dairy',
      'Strength training can help build healthy muscle mass',
      'Stay hydrated but avoid filling up on water before meals',
      'Consider tracking your daily calorie intake',
      'Get adequate sleep for proper recovery and metabolism',
    ],
  },
  normal: {
    category: 'normal',
    label: 'Normal Weight',
    range: '18.5 – 24.9',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    icon: '✅',
    adviceTitle: 'Maintain Your Healthy Balance',
    advice: [
      'Great job! Your BMI is within the healthy range.',
      'Continue maintaining your balanced lifestyle.',
      'Keep up with regular physical activity and mindful eating.',
    ],
    recommendations: [
      'Maintain a balanced diet with variety of nutrients',
      'Aim for 150 minutes of moderate exercise per week',
      'Stay hydrated — drink at least 8 glasses of water daily',
      'Prioritize sleep: 7-9 hours per night',
      'Practice mindful eating and portion control',
      'Include strength training 2-3 times per week',
      'Regular health check-ups to monitor your wellness',
    ],
  },
  overweight: {
    category: 'overweight',
    label: 'Overweight',
    range: '25 – 29.9',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    icon: '⚡',
    adviceTitle: 'Take Positive Steps Forward',
    advice: [
      'Your BMI suggests you are in the overweight range.',
      'Small, consistent changes can lead to great results.',
      'Consider a balanced approach to nutrition and activity.',
    ],
    recommendations: [
      'Incorporate more whole foods: vegetables, fruits, whole grains',
      'Reduce processed foods and added sugars',
      'Start with 30-minute daily walks and gradually increase',
      'Practice portion control — use smaller plates',
      'Include both cardio and resistance training',
      'Track your meals to identify patterns',
      'Set realistic weekly goals for gradual progress',
    ],
  },
  obese: {
    category: 'obese',
    label: 'Obese',
    range: '≥ 30',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
    icon: '❤️‍🩹',
    adviceTitle: 'Professional Guidance Recommended',
    advice: [
      'Your BMI indicates obesity, which may increase health risks.',
      'We strongly recommend consulting a healthcare professional.',
      'With proper support, significant improvement is achievable.',
    ],
    recommendations: [
      'Consult a doctor for a comprehensive health assessment',
      'Work with a registered dietitian for a personalized plan',
      'Consider a structured exercise program with professional guidance',
      'Focus on sustainable lifestyle changes, not quick fixes',
      'Monitor blood pressure, blood sugar, and cholesterol regularly',
      'Join a support group for motivation and accountability',
      'Celebrate non-scale victories: energy, mobility, confidence',
    ],
  },
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'overweight'
  return 'obese'
}