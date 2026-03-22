import Link from "next/link";

export default function Home() {
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
          <Link href="#" className="text-slate-700 hover:text-teal-600">Products</Link>
          <Link href="#" className="text-slate-700 hover:text-teal-600">Company</Link>
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

      {/* Why Choose Us */}
      <section className="px-8 py-20 bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose Us?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              An easy-to-use platform to streamline healthcare systems and workflow efficiency to enhance how you deliver care.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-t-4 border-teal-600">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4 text-xl">⚡</div>
              <h3 className="font-semibold text-slate-900 mb-2">Intelligent Analysis</h3>
              <p className="text-sm text-slate-600">Claude AI analyzes patterns with clinical context and surface high-confidence recommendations automatically.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-t-4 border-teal-600">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4 text-xl">🔗</div>
              <h3 className="font-semibold text-slate-900 mb-2">Seamless Integration</h3>
              <p className="text-sm text-slate-600">API-first design connects to Epic, Cerner, and other EHR systems with minimal infrastructure changes.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-t-4 border-teal-600">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4 text-xl">💰</div>
              <h3 className="font-semibold text-slate-900 mb-2">Cost Efficient</h3>
              <p className="text-sm text-slate-600">Reduce manual reconciliation time by 50% while staying within free tier limits with intelligent caching.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-t-4 border-teal-600">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4 text-xl">🛡️</div>
              <h3 className="font-semibold text-slate-900 mb-2">Security Focused</h3>
              <p className="text-sm text-slate-600">Enterprise-grade security with API key auth, rate limiting, and comprehensive audit trails.</p>
            </div>
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


