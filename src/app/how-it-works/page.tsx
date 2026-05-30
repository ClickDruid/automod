import Link from 'next/link'

const STEPS = [
  {
    n: '01',
    title: 'Export your product catalogue',
    desc: 'Download a CSV template from your AutoMod dashboard. Fill in your product SKUs, names, prices, compatible vehicles, and performance modifier values. No coding required for this step.',
    detail: [
      'SKU, product name, price',
      'Compatible car makes / models / years',
      'Part category (intake, exhaust, brakes, wheels, aero…)',
      'Performance stat modifiers (+HP, +handling, etc.) — we can estimate these for you',
      'Product image URL',
      'Optional: GLTF model URL for 3D representation',
    ],
  },
  {
    n: '02',
    title: 'Connect your store',
    desc: 'Install the AutoMod app from the Shopify App Store (or connect via API). We pull your live inventory and pricing directly — no manual syncing. Works with WooCommerce and Saleor too.',
    detail: [
      'Shopify App Store: 1-click install, no developer needed',
      'WooCommerce / Saleor: API key connection',
      'Inventory syncs live — price changes reflect immediately',
      'Add or remove products anytime from your existing admin',
    ],
  },
  {
    n: '03',
    title: 'Embed the configurator',
    desc: 'Drop one line of code onto any product page, landing page, or standalone URL. The configurator renders inside your site, inherits your branding, and checkout connects to your existing cart.',
    detail: [
      'One-line embed script — works anywhere',
      'Custom colours, fonts, and logo — matches your brand',
      'Checkout routes to your existing cart — no payment setup',
      'Mobile responsive out of the box',
    ],
  },
  {
    n: '04',
    title: 'Go live and track performance',
    desc: 'Launch and monitor real-time analytics. See which parts customers configure most, where they drop off, and average build value per session. Use this data to optimise your catalogue.',
    detail: [
      'Session analytics: time on page, parts configured, drop-off',
      'Revenue attribution: conversions from the configurator',
      'Build data: most popular combinations',
      'A/B testing: different stat values, part ordering',
    ],
  },
]

const DATA_FORMAT = `sku,name,category,price,compatible_cars,power,handling,braking,suspension,weight,turbo,image_url
BRK-001,Hawk HPS 5.0 Pads,brakes,145,"Honda Civic 2022,Honda Civic 2023",0,2,8,0,0,0,https://yourstore.com/img/hawk-hps.jpg
WHE-002,Enkei RPF1 17in Set,wheels,1200,"Honda Civic 2022,Toyota GR86 2023",0,6,4,0,-6,0,https://yourstore.com/img/rpf1.jpg
EXH-003,HKS Hi-Power Exhaust,exhaust,980,"Toyota GR86 2023,Subaru WRX 2023",8,-0,0,0,-4,3,https://yourstore.com/img/hks.jpg`

const EMBED_CODE = `<!-- AutoMod configurator embed -->
<script src="https://cdn.automod.io/embed.js"
  data-store="YOUR_STORE_ID"
  data-theme="dark"
  data-currency="USD">
</script>

<!-- Place anywhere on your page -->
<div id="automod-configurator"></div>`

const PLANS = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    features: ['Up to 500 products', '3 car models', 'Shopify integration', 'Basic analytics', 'Email support'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$299',
    period: '/month',
    features: ['Up to 5,000 products', '20 car models', 'All platforms', 'Advanced analytics', 'Priority support', 'Custom branding'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Unlimited products', 'Unlimited cars', 'GLTF model production service', 'White-label solution', 'Dedicated account manager', 'SLA'],
    cta: 'Book a call',
    highlight: false,
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-900 px-6 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-orange-500 font-black text-xl">AUTO</span>
          <span className="text-white font-black text-xl">MOD</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/configurator" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Live Demo
          </Link>
          <Link href="/my-car" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            My Car
          </Link>
          <a href="mailto:hello@automod.io"
            className="text-xs bg-orange-500 hover:bg-orange-400 text-white px-4 py-1.5 rounded-lg font-bold transition-colors">
            Book a call
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <p className="text-[10px] font-black tracking-widest text-orange-500 uppercase mb-3">Integration Guide</p>
          <h1 className="text-4xl font-black text-white mb-4">
            Your catalogue. Our engine.<br />Up in a day.
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            You already have the products. AutoMod maps them to a 3D configurator your customers
            will spend 3x longer with. Here is exactly how it works.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 mb-20">
          {STEPS.map((step, i) => (
            <div key={i} className="grid grid-cols-[64px_1fr] gap-6">
              <div className="text-3xl font-black text-zinc-800 leading-none pt-1">{step.n}</div>
              <div>
                <h2 className="text-lg font-black text-white mb-2">{step.title}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{step.desc}</p>
                <ul className="space-y-1.5">
                  {step.detail.map((d, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-zinc-500">
                      <span className="text-orange-500 mt-0.5 flex-shrink-0">▸</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CSV format */}
        <div className="mb-16">
          <h2 className="text-xl font-black text-white mb-2">Product data format</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Download the CSV template, fill it in with your products, and upload. That is it.
            We handle mapping, stat calculations, and the 3D rendering.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
            <pre className="text-[10px] text-zinc-400 font-mono leading-relaxed whitespace-pre">
{DATA_FORMAT}
            </pre>
          </div>
          <div className="flex gap-3 mt-4">
            <a href="#" className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors">
              ↓ Download CSV template
            </a>
            <span className="text-zinc-700">·</span>
            <a href="#" className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors">
              API documentation →
            </a>
          </div>
        </div>

        {/* Embed code */}
        <div className="mb-16">
          <h2 className="text-xl font-black text-white mb-2">Embed on your site</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Two lines. Works on any platform — Shopify, WooCommerce, Saleor, raw HTML.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
            <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed whitespace-pre">
{EMBED_CODE}
            </pre>
          </div>
        </div>

        {/* FAQ: "I have thousands of products" */}
        <div className="mb-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-base font-black text-white mb-4">
            Frequently asked questions
          </h2>
          {[
            {
              q: 'I have 10,000+ SKUs. How does the configurator know which parts fit which car?',
              a: 'Your CSV includes a compatible_cars column with car make/model/year combos. When a customer selects their car in the configurator, we filter your catalogue to only show compatible parts. The fitment database is live — add new compatibility rows and the configurator reflects it immediately.',
            },
            {
              q: 'Do I need 3D models of my products?',
              a: 'No. The configurator shows your product images prominently and uses geometric overlays on the car to indicate where each part fits (front lip, side skirts, etc.). For premium visual accuracy, you can supply GLTF model files — or we can produce them for you from product photos as part of our Enterprise plan.',
            },
            {
              q: 'What are the "performance stat modifiers"?',
              a: 'Each part can have modifier values (e.g. +8 power, -4 weight) that update the car\'s stats display in real time — like a car game. These are not simulation data; they\'re relative rating numbers to show customers the upgrade benefit at a glance. You can set these yourself or we estimate them based on your product category.',
            },
            {
              q: 'How long does setup take?',
              a: 'For a Shopify store with an existing product catalogue: under 1 business day. You install the app, upload your CSV, set your car models, and the configurator is live. For custom integrations (WooCommerce, headless, API), allow 2-3 days.',
            },
            {
              q: 'Can I use my own branding?',
              a: 'Yes. Growth and Enterprise plans include full white-label — your logo, your colour palette, your domain. The configurator looks like it was built by your team.',
            },
          ].map((item, i) => (
            <div key={i} className={`py-4 ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
              <p className="text-sm font-bold text-white mb-1.5">{item.q}</p>
              <p className="text-sm text-zinc-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-xl font-black text-white mb-8">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? 'border-orange-500 bg-orange-500/5'
                    : 'border-zinc-800 bg-zinc-900/40'
                }`}>
                {plan.highlight && (
                  <div className="text-[9px] font-black tracking-widest text-orange-500 uppercase mb-3">
                    Most popular
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-sm font-black text-white mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">{plan.price}</span>
                    <span className="text-xs text-zinc-500">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs text-zinc-400 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="mailto:hello@automod.io"
                  className={`w-full py-2.5 rounded-xl text-center text-xs font-black tracking-widest transition-colors ${
                    plan.highlight
                      ? 'bg-orange-500 hover:bg-orange-400 text-white'
                      : 'border border-zinc-700 hover:border-zinc-500 text-zinc-300'
                  }`}>
                  {plan.cta.toUpperCase()} →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-orange-500/10 to-zinc-900 border border-orange-500/20 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-black text-white mb-3">
            Ready to see it with your catalogue?
          </h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Send us your product list. We will set up a live demo configured for your store
            within 24 hours — no commitment, no payment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/configurator"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black text-xs tracking-widest rounded-xl transition-colors">
              TRY LIVE DEMO →
            </Link>
            <a href="mailto:hello@automod.io"
              className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-bold text-xs rounded-xl transition-colors">
              SEND YOUR CATALOGUE
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
