"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState('reconcile');
  const [reconcileInput, setReconcileInput] = useState(`[
  {"source": "epic", "medication": "Lisinopril", "dose": "10mg", "date": "2026-03-21"},
  {"source": "cerner", "medication": "Lisinopril", "dose": "10mg", "date": "2026-03-21"}
]`);
  const [qualityInput, setQualityInput] = useState(`{
  "medications": [
    {"medication": "Lisinopril", "dose": "10mg", "last_updated": "2026-03-21"}
  ],
  "patient_id": "12345"
}`);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const callAPI = async (endpoint: string, data: any) => {
    setLoading(true);
    try {
      const response = await fetch(`https://medisync-onye.vercel.app/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'a2d547e8ad217ca5015ea14e6aa01b0ba46526d71f3d719299ab7e1c874eebaa'
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      setResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const testReconciliation = () => {
    try {
      const data = { records: JSON.parse(reconcileInput) };
      callAPI('reconcile/medication', data);
    } catch (error) {
      setResult(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testQualityValidation = () => {
    try {
      const data = JSON.parse(qualityInput);
      callAPI('validate/data-quality', data);
    } catch (error) {
      setResult(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCostMonitoring = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://medisync-onye.vercel.app/api/admin/cost-monitor?date_range=7d', {
        headers: {
          'x-api-key': 'a2d547e8ad217ca5015ea14e6aa01b0ba46526d71f3d719299ab7e1c874eebaa'
        }
      });
      const result = await response.json();
      setResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const loadSampleData = (type: string) => {
    if (type === 'reconcile') {
      setReconcileInput(`[
  {"source": "epic", "medication": "Metformin", "dose": "500mg", "date": "2026-03-21"},
  {"source": "cerner", "medication": "Metformin", "dose": "500mg", "date": "2026-03-21"}
]`);
    } else if (type === 'quality') {
      setQualityInput(`{
  "medications": [
    {"medication": "Metformin", "dose": "500mg", "last_updated": "2026-03-21"}
  ],
  "patient_id": "12345"
}`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Top Bar */}
      <div className="bg-teal-600 text-white py-2 px-6 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <a href="#" className="hover:opacity-80">f</a>
          <a href="#" className="hover:opacity-80">📷</a>
          <a href="#" className="hover:opacity-80">in</a>
          <a href="#" className="hover:opacity-80">𝕏</a>
        </div>
        <div className="flex items-center gap-2">
          <span>📞</span>
          <span>+1 (917) 557-2585</span>
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-teal-600">onye</div>
        </div>
        <nav className="flex items-center gap-8 text-sm font-medium">
          <Link href="#" className="text-teal-600 border-b-2 border-teal-600">Home</Link>
          <Link href="#demo" className="text-slate-700 hover:text-teal-600">Try Demo</Link>
          <Link href="#features" className="text-slate-700 hover:text-teal-600">Features</Link>
          <Link href="#contact" className="text-slate-700 hover:text-teal-600">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2 border-2 border-teal-600 text-teal-600 rounded-full text-sm font-medium hover:bg-teal-50">
            Visit Directory
          </button>
          <button className="px-5 py-2 bg-teal-600 text-white rounded-full text-sm font-medium hover:bg-teal-700">
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 px-8 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-teal-600 font-semibold text-sm mb-2">MediSync by Onye</p>
            <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Unleash seamless clinical data reconciliation
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Empower your healthcare systems with AI-powered medication reconciliation, intelligent conflict resolution, and clinical safety validation across your EHR ecosystem.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-teal-600 text-white rounded-full font-semibold hover:bg-teal-700 transition">
                Launch Integration
              </button>
              <button className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-full font-semibold hover:border-teal-600 hover:text-teal-600 transition">
                Documentation
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">⚕️</div>
                <p className="text-slate-600 font-medium">Clinical Data Hub</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-600 font-semibold text-sm mb-2">MEDISYNC CAPABILITIES</p>
            <h2 className="text-4xl font-bold text-slate-900">
              Extract, Filter, Transform and Reconcile health data
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-slate-50 p-8 rounded-xl border-l-4 border-teal-600">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">✓</div>
                <h3 className="text-xl font-semibold text-slate-900">Multi-Source Reconciliation</h3>
              </div>
              <p className="text-slate-600">MediSync compares records across multiple EHR systems and surfaces the most confident medication recommendation with clinical reasoning.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl border-l-4 border-teal-600">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">✓</div>
                <h3 className="text-xl font-semibold text-slate-900">Cost-Effective Integration</h3>
              </div>
              <p className="text-slate-600">Our AI-powered approach reduces manual review time and integrates seamlessly with your existing EHR workflows while controlling costs.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl border-l-4 border-teal-600">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">✓</div>
                <h3 className="text-xl font-semibold text-slate-900">Metadata and Control</h3>
              </div>
              <p className="text-slate-600">Full audit trails, confidence scoring, and clinician override capabilities ensure you maintain control over every reconciliation decision.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl border-l-4 border-teal-600">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">✓</div>
                <h3 className="text-xl font-semibold text-slate-900">Compliance with Standards</h3>
              </div>
              <p className="text-slate-600">Built with HIPAA and healthcare standards in mind, MediSync ensures your patient data is handled with the utmost care and confidentiality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="px-8 py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-600 font-semibold text-sm mb-2">INTERACTIVE DEMO</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Try MediSync Features Live
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Experience AI-powered clinical data reconciliation in action. Test medication reconciliation, data quality validation, and cost monitoring with sample data.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('reconcile')}
                className={`px-6 py-4 text-sm font-medium flex-1 ${
                  activeTab === 'reconcile'
                    ? 'bg-teal-600 text-white border-b-2 border-teal-600'
                    : 'text-slate-600 hover:text-teal-600'
                }`}
              >
                🔄 Medication Reconciliation
              </button>
              <button
                onClick={() => setActiveTab('quality')}
                className={`px-6 py-4 text-sm font-medium flex-1 ${
                  activeTab === 'quality'
                    ? 'bg-teal-600 text-white border-b-2 border-teal-600'
                    : 'text-slate-600 hover:text-teal-600'
                }`}
              >
                ✅ Data Quality Validation
              </button>
              <button
                onClick={() => setActiveTab('cost')}
                className={`px-6 py-4 text-sm font-medium flex-1 ${
                  activeTab === 'cost'
                    ? 'bg-teal-600 text-white border-b-2 border-teal-600'
                    : 'text-slate-600 hover:text-teal-600'
                }`}
              >
                💰 Cost Monitoring
              </button>
            </div>

            {/* Demo Content */}
            <div className="p-8">
              {activeTab === 'reconcile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Medication Reconciliation</h3>
                    <p className="text-slate-600 mb-4">Enter medication records from different EHR systems to see AI-powered reconciliation.</p>
                    <button
                      onClick={() => loadSampleData('reconcile')}
                      className="mb-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
                    >
                      Load Sample Data
                    </button>
                    <textarea
                      value={reconcileInput}
                      onChange={(e) => setReconcileInput(e.target.value)}
                      className="w-full h-32 p-4 border border-slate-300 rounded-lg font-mono text-sm"
                      placeholder="Enter medication records as JSON array..."
                    />
                  </div>
                  <button
                    onClick={testReconciliation}
                    disabled={loading}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : '🔄 Reconcile Medications'}
                  </button>
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Data Quality Validation</h3>
                    <p className="text-slate-600 mb-4">Validate medication data for completeness, accuracy, and timeliness.</p>
                    <button
                      onClick={() => loadSampleData('quality')}
                      className="mb-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
                    >
                      Load Sample Data
                    </button>
                    <textarea
                      value={qualityInput}
                      onChange={(e) => setQualityInput(e.target.value)}
                      className="w-full h-32 p-4 border border-slate-300 rounded-lg font-mono text-sm"
                      placeholder="Enter medication data as JSON..."
                    />
                  </div>
                  <button
                    onClick={testQualityValidation}
                    disabled={loading}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
                  >
                    {loading ? 'Validating...' : '✅ Validate Data Quality'}
                  </button>
                </div>
              )}

              {activeTab === 'cost' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Cost Monitoring</h3>
                    <p className="text-slate-600 mb-4">View AI usage costs, API calls, and performance metrics.</p>
                  </div>
                  <button
                    onClick={testCostMonitoring}
                    disabled={loading}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : '💰 View Cost Report'}
                  </button>
                </div>
              )}

              {/* Results Display */}
              {result && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Results:</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <pre className="text-sm text-slate-800 whitespace-pre-wrap overflow-x-auto">
                      {result}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              💡 <strong>Demo Mode:</strong> Using production API key for live testing. Features work with real AI processing and database logging.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-24 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Let's talk about your <span className="text-teal-600">use case</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Ready to streamline medication reconciliation? Connect with our team to explore how MediSync can transform your clinical workflows.
          </p>
          <button className="px-8 py-3 bg-teal-600 text-white rounded-full font-semibold hover:bg-teal-700 transition">
            Get in Touch
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 px-8 text-center text-sm">
        <p>© {new Date().getFullYear()} Onye Inc • MediSync Clinical Data Reconciliation</p>
      </footer>
    </div>
  );
}


