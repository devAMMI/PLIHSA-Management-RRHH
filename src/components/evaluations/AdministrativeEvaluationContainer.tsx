import { useState, useEffect } from 'react';
import { AdministrativeEvaluationWelcome } from './AdministrativeEvaluationWelcome';
import { AdministrativeEvaluationForm } from './AdministrativeEvaluationForm';
import { EvaluationsList } from './EvaluationsList';

type ViewMode = 'welcome' | 'form' | 'list';

interface AdministrativeEvaluationContainerProps {
  editingEvaluationId?: string | null;
  onBack?: () => void;
}

export function AdministrativeEvaluationContainer({ editingEvaluationId, onBack }: AdministrativeEvaluationContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('welcome');

  useEffect(() => {
    if (editingEvaluationId) {
      setViewMode('form');
    }
  }, [editingEvaluationId]);

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
    return <AdministrativeEvaluationForm editingEvaluationId={editingEvaluationId} onCancel={onBack} />;
  }

  return (
    <AdministrativeEvaluationWelcome
      onStartEvaluation={() => setViewMode('form')}
      onViewEvaluations={() => setViewMode('list')}
    />
  );
}
