import React, { useState } from 'react';
import RequirementsForm from '../components/modules/SiteSelection/RequirementsForm';
import ResultsView from '../components/modules/SiteSelection/ResultsView';
import { Layers } from 'lucide-react';

const SiteSelectionPage: React.FC = () => {
    const [results, setResults] = useState<any>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Site Selection</h1>
                    <p className="text-slate-500 mt-1">Define your project requirements to find the optimal location.</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <Layers className="w-4 h-4" />
                    <span>Model Version: v1.0.2 (Production)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <RequirementsForm onResults={setResults} />
                </div>

                <div className="lg:col-span-2">
                    {results ? (
                        <ResultsView results={results} />
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Layers className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No Analysis Run Yet</h3>
                            <p className="text-slate-500 mt-2 max-w-sm">
                                Fill out the project requirements form on the left to generate AI-powered site recommendations.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SiteSelectionPage;
