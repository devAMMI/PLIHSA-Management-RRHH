import { useState } from 'react';
import { OperativeEvaluationWelcome } from './OperativeEvaluationWelcome';
import { OperativeEvaluationForm } from './OperativeEvaluationForm';
import { EvaluationsList } from './EvaluationsList';

type ViewMode = 'welcome' | 'form' | 'list';

export function OperativeEvaluationContainer() {
  const [viewMode, setViewMode] = useState<ViewMode>('welcome');

  if (viewMode === 'list') {
    return (
      <EvaluationsList
        evaluationType="operative"
        onBack={() => setViewMode('welcome')}
        onNewEvaluation={() => setViewMode('form')}
      />
    );
  }

  if (viewMode === 'form') {
    return <OperativeEvaluationForm />;
  }

  return (
    <OperativeEvaluationWelcome
      onStartEvaluation={() => setViewMode('form')}
      onViewEvaluations={() => setViewMode('list')}
    />
  );
}
