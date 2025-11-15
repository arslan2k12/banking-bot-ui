import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star, StarHalf, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { EvaluationSummary } from '../types';

interface EvaluationDisplayProps {
  evaluation: EvaluationSummary;
}

export const EvaluationDisplay: React.FC<EvaluationDisplayProps> = ({ evaluation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderStars = (score: number, maxScore: number = 5) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = maxScore - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-400" />
        ))}
        <span className="ml-2 text-sm text-gray-400">({score}/{maxScore})</span>
      </div>
    );
  };

  const getConfidenceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="mt-3 border-t border-gray-600 pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left hover:bg-gray-600 rounded-lg p-2 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Answer Confidence</span>
          </div>
          {renderStars(evaluation.overall_score)}
          <div className={`flex items-center space-x-1 ${getConfidenceColor(evaluation.confidence_level)}`}>
            {getConfidenceIcon(evaluation.confidence_level)}
            <span className="text-sm capitalize">{evaluation.confidence_level}</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-4 px-2">
          {/* Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Evaluation Summary</h4>
            <p className="text-sm text-gray-400 leading-relaxed">{evaluation.summary}</p>
          </div>

          {/* Detailed Scores */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Detailed Scores</h4>
            <div className="space-y-2">
              {evaluation.criteria_scores.map((criterion, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300">{criterion.criterion}</span>
                    {renderStars(criterion.score)}
                  </div>
                  <p className="text-xs text-gray-500">{criterion.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          {evaluation.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {evaluation.weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {evaluation.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <span className="text-xs text-gray-500">Was this evaluation helpful?</span>
            <div className="flex items-center space-x-2">
              <button className="p-1 hover:bg-gray-700 rounded text-green-400 hover:text-green-300 transition-colors">
                👍
              </button>
              <button className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300 transition-colors">
                👎
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
