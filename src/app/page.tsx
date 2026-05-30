import Link from 'next/link'

const FEATURES = [
  {
    icon: '🚗',
    title: '3D Car Visualizer',
    description: 'Customers see their exact car in real-time 3D. Parts appear on the model the moment they click.',
  },
  {
    icon: '📊',
    title: 'Live Stat Engine',
    description: 'Every part has real performance data. Power, handling, braking — all update instantly like a car game.',
  },
  {
    icon: '🎮',
    title: 'Gamified Experience',
    description: 'Buying parts feels like upgrading in Need for Speed. Customers spend more time and buy more confidently.',
  },
  {
    icon: '🔧',
    title: 'Smart Fitment',
    description: 'Only shows parts compatible with the selected car. No more wrong purchases, no more returns.',
  },
  {
    icon: '🛒',
    title: 'Native Checkout',
    description: 'Connects to your existing Shopify or Saleor store. No separate checkout, no friction.',
  },
  {
    icon: '📱',
    title: 'Mobile First',
    description: "Fully responsive. Customers can configure their build on the phone they're shopping from.",
  },
]

const STATS = [
  { value: '3.2×', label: 'Avg. time on page vs standard product grid' },
  { value: '41%', label: 'Reduction in returns from wrong part selection' },
  { value: '28%', label: 'Increase in average order value' },
  { value: '0', label: 'Code required to install on your store' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-900 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-orange-500 font-black text-2xl tracking-tight">AUTO</span>
          <span className="text-white font-black text-2xl tracking-tight">MOD</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/configurator" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Live Demo
          </Link>
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Features
          </a>
          <a
            href="mailto:hello@automod.io"
            className="text-sm bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Get Early Access
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-24 pb-20 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          🚀 Now in early access
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6">
          Your customers do not just want
          <br />
          <span className="text-orange-500">to buy parts.</span>
          <br />
          They want to build their car.
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          AutoMod is a 3D car configurator that plugs into your car parts store.
          Customers select parts, see them on their actual car in real-time, and watch
          their performance stats change — like a car game, but real.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/configurator"
            className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-lg transition-colors"
          >
            Try the Demo →
          </Link>
          <a
            href="mailto:hello@automod.io"
            className="px-8 py-4 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium rounded-xl text-lg transition-colors"
          >
            Book a Call
          </a>
        </div>

        <p className="text-xs text-zinc-600 mt-4">
          No credit card · No install required to demo · Works with Shopify, Saleor, WooCommerce
        </p>
      </section>

      {/* Stats bar */}
      <section className="border-y border-zinc-900 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-orange-500 mb-2">{stat.value}</div>
              <div className="text-xs text-zinc-500 leading-relaxed">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">
            Everything your store needs to sell parts differently
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            AutoMod replaces your flat product grid with an experience customers actually enjoy.
            The result: longer sessions, fewer returns, bigger baskets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(feature => (
            <div
              key={feature.title}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="bg-gradient-to-br from-orange-500/10 to-zinc-900 border border-orange-500/20 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-black mb-4">
            See it on your catalogue in 5 minutes
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Send us your parts catalogue and car list. We will set up a branded demo
            configured for your store in one business day — no commitment.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/configurator"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-colors"
            >
              Try Demo First →
            </Link>
            <a
              href="mailto:hello@automod.io"
              className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium rounded-xl transition-colors"
            >
              Get Custom Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-8 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-orange-500 font-black">AUTO</span>
            <span className="text-white font-black">MOD</span>
          </div>
          <p className="text-xs text-zinc-600">
            Early access · hello@automod.io
          </p>
        </div>
      </footer>
    </div>
  )
}
