import React, { useState, useEffect } from 'react';
import { EvaluationDisplay } from './EvaluationDisplay';

interface EvaluationSectionProps {
  answerComplete: boolean;
  evaluationData: any;
}

export const EvaluationSection: React.FC<EvaluationSectionProps> = React.memo(({
  answerComplete,
  evaluationData,
}) => {
  const [showEvaluation, setShowEvaluation] = useState(false);

  useEffect(() => {
    if (answerComplete && !evaluationData) {
      setShowEvaluation(true);
    }
  }, [answerComplete, evaluationData]);

  if (!answerComplete) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-gray-700 pt-3">
      {evaluationData ? (
        // Show evaluation when complete
        <EvaluationDisplay evaluation={evaluationData} />
      ) : showEvaluation ? (
        // Show placeholder while waiting for evaluation
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-gray-300">Answer Confidence</span>
            </div>
            <span className="text-xs text-gray-500">Evaluating...</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Please wait while we assess the response quality
          </div>
        </div>
      ) : null}
    </div>
  );
});

EvaluationSection.displayName = 'EvaluationSection';
