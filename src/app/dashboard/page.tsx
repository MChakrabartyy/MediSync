"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface ReconciliationResult {
  id: string;
  timestamp: string;
  recommendation: string;
  confidence: number;
  clinical_reasoning: string;
  conflicts: any[];
  quality_score?: number;
  status: 'pending' | 'approved' | 'rejected';
  patient_id: string;
}

export default function Dashboard() {
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Load sample data for demo
  useEffect(() => {
    const sampleResults: ReconciliationResult[] = [
      {
        id: "rec_001",
        timestamp: "2026-03-21T14:30:00Z",
        recommendation: "Lisinopril 10mg daily",
        confidence: 0.95,
        clinical_reasoning: "Records match across both systems with same dosage. No conflicts detected. Patient has hypertension diagnosis consistent with ACE inhibitor therapy.",
        conflicts: [],
        quality_score: 0.92,
        status: 'pending',
        patient_id: "PT-12345"
      },
      {
        id: "rec_002",
        timestamp: "2026-03-21T14:25:00Z",
        recommendation: "Metformin 500mg twice daily",
        confidence: 0.78,
        clinical_reasoning: "Dosage discrepancy found: Epic shows 1000mg daily, Cerner shows 500mg twice daily. Recommending higher confidence Cerner record based on more recent update.",
        conflicts: ["Dosage mismatch: 1000mg vs 500mg twice daily"],
        quality_score: 0.85,
        status: 'pending',
        patient_id: "PT-67890"
      },
      {
        id: "rec_003",
        timestamp: "2026-03-21T14:20:00Z",
        recommendation: "Aspirin 81mg daily",
        confidence: 0.65,
        clinical_reasoning: "Incomplete records. Epic missing dosage, Cerner missing frequency. Clinical context suggests low-dose aspirin for cardiovascular prevention.",
        conflicts: ["Missing dosage in Epic", "Missing frequency in Cerner"],
        quality_score: 0.72,
        status: 'pending',
        patient_id: "PT-11111"
      }
    ];
    setResults(sampleResults);
  }, []);

  const getQualityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100';
    if (score >= 0.8) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleApproval = (resultId: string, approved: boolean) => {
    setResults(prev => prev.map(result =>
      result.id === resultId
        ? { ...result, status: approved ? 'approved' : 'rejected' }
        : result
    ));
  };

  const runNewReconciliation = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://medisync-onye.vercel.app/api/reconcile/medication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'a2d547e8ad217ca5015ea14e6aa01b0ba46526d71f3d719299ab7e1c874eebaa'
        },
        body: JSON.stringify({
          records: [
            { source: "epic", medication: "Lisinopril", dose: "10mg", date: "2026-03-21" },
            { source: "cerner", medication: "Lisinopril", dose: "10mg", date: "2026-03-21" }
          ]
        })
      });

      const data = await response.json();

      const newResult: ReconciliationResult = {
        id: `rec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        recommendation: data.recommendation || "Unable to reconcile",
        confidence: data.confidence || 0,
        clinical_reasoning: data.clinical_reasoning || "Analysis failed",
        conflicts: data.conflicts || [],
        quality_score: 0.88,
        status: 'pending',
        patient_id: "PT-NEW"
      };

      setResults(prev => [newResult, ...prev]);
    } catch (error) {
      console.error('Failed to run reconciliation:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-teal-600">onye</Link>
            <span className="text-slate-400">|</span>
            <h1 className="text-xl font-semibold text-slate-900">MediSync Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runNewReconciliation}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Running...' : '🔄 New Reconciliation'}
            </button>
            <Link href="/" className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Reconciliations</h2>
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className={`p-4 rounded-lg border cursor-pointer transition ${
                  selectedResult?.id === result.id
                    ? 'border-teal-300 bg-teal-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900">
                    Patient {result.patient_id}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 truncate">{result.recommendation}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`text-xs px-2 py-1 rounded ${getQualityColor(result.quality_score || 0)}`}>
                    Quality: {Math.round((result.quality_score || 0) * 100)}%
                  </div>
                  <div className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                    {Math.round(result.confidence * 100)}% confident
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedResult ? (
            <div className="max-w-4xl">
              {/* Header */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Patient {selectedResult.patient_id}
                  </h2>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedResult.status)}`}>
                    {selectedResult.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getQualityColor(selectedResult.quality_score || 0)} mb-2`}>
                      <span className="text-2xl font-bold">
                        {Math.round((selectedResult.quality_score || 0) * 100)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Data Quality</p>
                  </div>

                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-2`}>
                      <span className={`text-2xl font-bold ${getConfidenceColor(selectedResult.confidence)}`}>
                        {Math.round(selectedResult.confidence * 100)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">AI Confidence</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {selectedResult.conflicts.length}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Conflicts Found</p>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">🤖 AI Recommendation</h3>
                  <p className="text-xl font-medium text-slate-900 mb-4">{selectedResult.recommendation}</p>

                  {selectedResult.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproval(selectedResult.id, true)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleApproval(selectedResult.id, false)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Clinical Reasoning */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">🔍 Clinical Reasoning</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedResult.clinical_reasoning}</p>
                </div>

                {/* Conflicts */}
                {selectedResult.conflicts.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">⚠️ Conflicts Detected</h3>
                    <ul className="space-y-2">
                      {selectedResult.conflicts.map((conflict, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span className="text-red-800">{conflict}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-sm text-slate-500">
                  <p>Reconciliation ID: {selectedResult.id}</p>
                  <p>Timestamp: {new Date(selectedResult.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Reconciliation</h3>
                <p className="text-slate-600">Choose a reconciliation from the sidebar to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}