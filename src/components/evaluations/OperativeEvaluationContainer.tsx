import { useState, useEffect } from 'react';
import { OperativeEvaluationWelcome } from './OperativeEvaluationWelcome';
import { OperativeEvaluationForm } from './OperativeEvaluationForm';
import { EvaluationsList } from './EvaluationsList';

type ViewMode = 'welcome' | 'form' | 'list';

interface OperativeEvaluationContainerProps {
  editingEvaluationId?: string | null;
  onBack?: () => void;
}

export function OperativeEvaluationContainer({ editingEvaluationId, onBack }: OperativeEvaluationContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('welcome');

  useEffect(() => {
    if (editingEvaluationId) {
      setViewMode('form');
    }
  }, [editingEvaluationId]);

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
    return <OperativeEvaluationForm editingEvaluationId={editingEvaluationId} onCancel={onBack} />;
  }

  return (
    <OperativeEvaluationWelcome
      onStartEvaluation={() => setViewMode('form')}
      onViewEvaluations={() => setViewMode('list')}
    />
  );
}
