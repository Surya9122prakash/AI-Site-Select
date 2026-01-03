import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

interface RequirementsFormProps {
    onResults: (data: any) => void;
}

const RequirementsForm: React.FC<RequirementsFormProps> = ({ onResults }) => {
    const { register, handleSubmit } = useForm({
        defaultValues: {
            title: '',
            budget_limit_usd_sqm: 100,
            max_road_dist_km: 5,
            max_slope_deg: 10,
            environmental_risk_tolerance: 0.5,
            preferred_land_use: ['Industrial', 'Commercial']
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError('');
        try {
            const payload = {
                ...data,
                budget_limit_usd_sqm: Number(data.budget_limit_usd_sqm),
                max_road_dist_km: Number(data.max_road_dist_km),
                max_slope_deg: Number(data.max_slope_deg),
                environmental_risk_tolerance: Number(data.environmental_risk_tolerance),
                preferred_land_use: Array.isArray(data.preferred_land_use) ? data.preferred_land_use : [data.preferred_land_use]
            };

            const response = await api.post('/recommend-sites', payload);
            onResults(response.data);
        } catch (err: any) {
            console.error('Analysis error:', err);
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Handle Pydantic validation errors
                const messages = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
                setError(`Validation Error: ${messages}`);
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError('Failed to fetch recommendations. Please check your inputs.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900">Project Parameters</h2>
                <p className="text-sm text-slate-500 mt-1">Define constraints for the AI model.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                    <input
                        {...register('title', { required: "Title is required" })}
                        type="text"
                        placeholder="e.g., New Factory Site A"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Budget (USD/sqm)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            {...register('budget_limit_usd_sqm', { required: true, min: 0 })}
                            type="number"
                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Distance to Road (km)</label>
                    <input
                        {...register('max_road_dist_km', { required: true, min: 0 })}
                        type="number"
                        step="0.1"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Slope (degrees)</label>
                    <input
                        {...register('max_slope_deg', { required: true, min: 0, max: 90 })}
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Risk Tolerance (0.0 - 1.0)
                        <span className="ml-2 text-xs text-slate-400 font-normal">Higher = More risky sites allowed</span>
                    </label>
                    <input
                        {...register('environmental_risk_tolerance', { required: true, min: 0, max: 1 })}
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Conservative</span>
                        <span>Aggressive</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Land Use</label>
                    <div className="space-y-2">
                        {['Industrial', 'Commercial', 'Residential', 'Agricultural'].map((type) => (
                            <label key={type} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    value={type}
                                    {...register('preferred_land_use')}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Search className="w-5 h-5 mr-2" />
                            Find Optimal Sites
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default RequirementsForm;
