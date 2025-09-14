import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain } from 'lucide-react';

const AIInsightCard = ({ insight }) => {
  if (!insight) return null;

  return (
    <div className="health-card bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Health Insights</h3>
          <p className="text-sm text-gray-600">
            {new Date(insight.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 my-4" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-gray-50" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-4 py-2 text-sm text-gray-900 border-t" {...props} />
            ),
            h1: ({ node, ...props }) => (
              <h1 className="text-xl font-bold text-gray-900 mt-6 mb-4" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-base font-medium text-gray-900 mt-4 mb-2" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="text-gray-700 mb-4" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-6 mb-4 text-gray-700" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-6 mb-4 text-gray-700" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="mb-1" {...props} />
            ),
            hr: ({ node, ...props }) => (
              <hr className="my-6 border-gray-200" {...props} />
            )
          }}
        >
          {insight.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default AIInsightCard;