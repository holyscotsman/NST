/* Nutanix Practice Exams — single-source configuration.
 * Every mode reads these values; change them here only. */
window.PE_CONFIG = {
  PASS_THRESHOLD: 0.80,        // 80% to pass (Exam Mode)
  EXAM_QUESTION_COUNT: 75,     // questions drawn per Exam Mode attempt (whole bank if smaller)
  EXAM_TIME_LIMIT_MIN: 90,     // Exam Mode countdown, in minutes
  SHUFFLE_QUESTIONS: true,     // Exam Mode: randomize which questions and their order
  SHUFFLE_OPTIONS: true,       // Exam Mode: randomize answer-option order
  TIMER_LOW_MIN: 5,            // Exam Mode: timer chip turns amber at/under this many minutes
};
