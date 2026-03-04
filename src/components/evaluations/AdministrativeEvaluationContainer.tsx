import { useState } from 'react';
import { AdministrativeEvaluationWelcome } from './AdministrativeEvaluationWelcome';
import { AdministrativeEvaluationForm } from './AdministrativeEvaluationForm';
import { EvaluationsList } from './EvaluationsList';

type ViewMode = 'welcome' | 'form' | 'list';

export function AdministrativeEvaluationContainer() {
  const [viewMode, setViewMode] = useState<ViewMode>('welcome');

  if (viewMode === 'list') {
    return (
      <EvaluationsList
        evaluationType="administrative"
        onBack={() => setViewMode('welcome')}
        onNewEvaluation={() => setViewMode('form')}
      />
    );
  }

  if (viewMode === 'form') {
    return <AdministrativeEvaluationForm />;
  }

  return (
    <AdministrativeEvaluationWelcome
      onStartEvaluation={() => setViewMode('form')}
      onViewEvaluations={() => setViewMode('list')}
    />
  );
}
