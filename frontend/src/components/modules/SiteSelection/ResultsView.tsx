import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

/* ---------------- TYPES ---------------- */

interface Recommendation {
    Site_Code: string;
    Latitude?: number | null;
    Longitude?: number | null;
    Land_Use: string;
    District?: string;
    State_Key?: string;
    Final_Suitability_Rank?: number | null;
    AI_Predicted_Score?: number | null;
    Suitability_Score?: number | null;
}

interface ResultsViewProps {
    results: {
        recommendations: Recommendation[];
        user?: string;
        analysis_user?: string;
        user_role?: string;
    };
}

/* ---------------- HELPERS ---------------- */

const isValidNumber = (v?: number | null) =>
    typeof v === 'number' && !isNaN(v);

const safeToFixed = (v?: number | null, digits = 2) =>
    isValidNumber(v) ? v!.toFixed(digits) : 'N/A';

const hasValidCoords = (lat?: number | null, lon?: number | null) =>
    isValidNumber(lat) && isValidNumber(lon);

const ResultsView: React.FC<ResultsViewProps> = ({ results }) => {
    const recommendations = Array.isArray(results?.recommendations)
        ? results.recommendations
        : [];

    const getScore = (r: Recommendation) =>
        r.AI_Predicted_Score ?? r.Final_Suitability_Rank ?? r.Suitability_Score ?? null;

    const safeRecommendations = recommendations.filter(
        (r) => isValidNumber(getScore(r))
    );

    const topSite = safeRecommendations[0];

    if (!safeRecommendations.length) {
        return (
            <div className="p-8 text-center text-slate-500">
                No valid recommendations available
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Top Recommendation</p>
                        <p className="text-lg font-bold text-slate-900">
                            {topSite?.Site_Code ?? 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Candidates</p>
                        <p className="text-lg font-bold text-slate-900">
                            {safeRecommendations.length}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Analysis By</p>
                        <p className="text-lg font-bold text-slate-900">
                            {results.user || results.analysis_user || 'Unknown'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl border shadow-sm h-[400px]">
                    <h3 className="font-semibold mb-4">Geospatial Visualization</h3>

                    <MapContainer
                        center={[
                            topSite?.Latitude ?? 20.5937,
                            topSite?.Longitude ?? 78.9629,
                        ]}
                        zoom={5}
                        style={{ height: '320px', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {safeRecommendations
                            .filter((s) => hasValidCoords(s.Latitude, s.Longitude))
                            .map((site) => (
                                <Marker
                                    key={site.Site_Code}
                                    position={[site.Latitude!, site.Longitude!]}
                                >
                                    <Popup>
                                        <div className="font-semibold">{site.Site_Code}</div>
                                        <div className="text-sm text-slate-600">
                                            {site.District}, {site.State_Key}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {site.Land_Use}
                                        </div>
                                        <div className="text-xs font-bold text-blue-600 mt-2">
                                            Rank: {safeToFixed(getScore(site))}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                    </MapContainer>
                </div>

                <div className="bg-white p-4 rounded-xl border shadow-sm h-[400px]">
                    <h3 className="font-semibold mb-4">Suitability Score Comparison</h3>

                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={safeRecommendations} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="Site_Code" type="category" width={90} />
                            <Tooltip />
                            <Bar dataKey={(r) => getScore(r)} name="Score" barSize={28} fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">Rank</th>
                            <th className="px-6 py-3">Site</th>
                            <th className="px-6 py-3">Land Use</th>
                            <th className="px-6 py-3">Coordinates</th>
                            <th className="px-6 py-3">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeRecommendations.map((site, i) => (
                            <tr key={site.Site_Code} className="border-t">
                                <td className="px-6 py-3 font-semibold">#{i + 1}</td>
                                <td className="px-6 py-3 text-blue-600">
                                    {site.Site_Code}
                                </td>
                                <td className="px-6 py-3">{site.Land_Use}</td>
                                <td className="px-6 py-3 font-mono text-xs">
                                    {hasValidCoords(site.Latitude, site.Longitude)
                                        ? `${safeToFixed(site.Latitude, 4)}, ${safeToFixed(site.Longitude, 4)}`
                                        : 'N/A'}
                                </td>
                                <td className="px-6 py-3">
                                    {safeToFixed(getScore(site), 2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResultsView;
