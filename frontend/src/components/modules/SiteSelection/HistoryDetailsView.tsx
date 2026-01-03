import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import ResultsView from './ResultsView';
import { Loader2, ArrowLeft } from 'lucide-react';

const HistoryDetailsView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/history/${id}`);
                setData(response.data);
            } catch (err) {
                console.error('Failed to fetch job details:', err);
                setError('Failed to load job details.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => navigate('/dashboard/history')}
                    className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to History
                </button>
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/dashboard/history')}
                    className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to History
                </button>
                <div className="text-sm text-slate-500">
                    Analysis from {new Date(data.timestamp).toLocaleString()}
                </div>
            </div>

            <ResultsView results={data} />
        </div>
    );
};

export default HistoryDetailsView;
