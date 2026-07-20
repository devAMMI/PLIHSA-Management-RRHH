import { useState, useEffect } from 'react';
import { FinalEvaluationWelcome } from './FinalEvaluationWelcome';
import { FinalAdministrativeEvaluationForm } from './FinalAdministrativeEvaluationForm';
import { FinalEvaluationsList } from './FinalEvaluationsList';

type ViewMode = 'welcome' | 'form' | 'list';

interface FinalEvaluationContainerProps {
  editingEvaluationId?: string | null;
  onBack?: () => void;
}

export function FinalEvaluationContainer({ editingEvaluationId, onBack }: FinalEvaluationContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('welcome');

  useEffect(() => {
    if (editingEvaluationId) {
      setViewMode('form');
    }
  }, [editingEvaluationId]);

  if (viewMode === 'list') {
    return (
      <FinalEvaluationsList
        onBack={() => setViewMode('welcome')}
        onNewEvaluation={() => setViewMode('form')}
        onEditEvaluation={(evaluationId) => setViewMode('form')}
      />
    );
  }

  if (viewMode === 'form') {
    return (
      <FinalAdministrativeEvaluationForm
        editingEvaluationId={editingEvaluationId}
        onCancel={onBack || (() => setViewMode('welcome'))}
      />
    );
  }

  return (
    <FinalEvaluationWelcome
      onStartEvaluation={() => setViewMode('form')}
      onViewEvaluations={() => setViewMode('list')}
    />
  );
}
