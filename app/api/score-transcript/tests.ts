interface ScoreValidation {
  min: number;
  max: number;
  threshold: number;
  message: string;
}

interface TestResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const scoreThresholds: Record<string, ScoreValidation> = {
  totalScore: {
    min: 0,
    max: 100,
    threshold: 50,
    message: "Total score should be between 0-100 and above 50 for acceptable quality"
  },
  "Content Clarity and Relevance": {
    min: 0,
    max: 30,
    threshold: 15,
    message: "Content clarity score should be between 0-30 and above 15 for acceptable quality"
  },
  "Instructional Structure": {
    min: 0,
    max: 20,
    threshold: 10,
    message: "Instructional structure score should be between 0-20 and above 10 for acceptable quality"
  },
  "Engagement and Interaction": {
    min: 0,
    max: 20,
    threshold: 10,
    message: "Engagement score should be between 0-20 and above 10 for acceptable quality"
  },
  "Language and Presentation": {
    min: 0,
    max: 20,
    threshold: 10,
    message: "Language score should be between 0-20 and above 10 for acceptable quality"
  },
  "Additional Value and Accessibility": {
    min: 0,
    max: 10,
    threshold: 5,
    message: "Additional value score should be between 0-10 and above 5 for acceptable quality"
  }
};

export function runTests(response: any): TestResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Test 1: Check if response is valid JSON
  if (!response || typeof response !== 'object') {
    errors.push("Invalid response format");
    return { isValid: false, errors, warnings };
  }

  // Test 2: Check required fields
  const requiredFields = [
    'explanation',
    'totalScore',
    'Content Clarity and Relevance',
    'Instructional Structure',
    'Engagement and Interaction',
    'Language and Presentation',
    'Additional Value and Accessibility'
  ];

  requiredFields.forEach(field => {
    if (!(field in response)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Test 3: Check explanation content
  if (typeof response.explanation !== 'string' || response.explanation.length < 50) {
    warnings.push("Explanation is too short or missing");
  }

  // Test 4: Validate score ranges and thresholds
  Object.entries(scoreThresholds).forEach(([key, validation]) => {
    const score = response[key];
    
    // Range check
    if (typeof score !== 'number' || score < validation.min || score > validation.max) {
      errors.push(`${key}: Score must be between ${validation.min} and ${validation.max}`);
    }
    
    // Threshold check
    if (typeof score === 'number' && score < validation.threshold) {
      warnings.push(`${key}: Score (${score}) is below minimum threshold of ${validation.threshold}`);
    }
  });

  // Test 5: Check score sum
  const subScores = [
    response["Content Clarity and Relevance"],
    response["Instructional Structure"],
    response["Engagement and Interaction"],
    response["Language and Presentation"],
    response["Additional Value and Accessibility"]
  ];

  const sum = subScores.reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
  if (Math.abs(sum - response.totalScore) > 0.1) {
    errors.push(`Total score (${response.totalScore}) does not match sum of subscores (${sum})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
} 