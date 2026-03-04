import { useState } from 'react';
import { AdministrativeEvaluationWelcome } from './AdministrativeEvaluationWelcome';
import { AdministrativeEvaluationForm } from './AdministrativeEvaluationForm';

export function AdministrativeEvaluationContainer() {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return <AdministrativeEvaluationWelcome onStartEvaluation={() => setShowForm(true)} />;
  }

  return <AdministrativeEvaluationForm />;
}
