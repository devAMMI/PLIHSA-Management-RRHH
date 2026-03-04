import { useState } from 'react';
import { OperativeEvaluationWelcome } from './OperativeEvaluationWelcome';
import { OperativeEvaluationForm } from './OperativeEvaluationForm';

export function OperativeEvaluationContainer() {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return <OperativeEvaluationWelcome onStartEvaluation={() => setShowForm(true)} />;
  }

  return <OperativeEvaluationForm />;
}
