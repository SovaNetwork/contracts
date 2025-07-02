import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RequireWallet } from '@/components/web3/connect-wallet'
import { 
  Bitcoin, 
  ArrowLeftRight, 
  Coins, 
  TrendingUp, 
  Shield, 
  Zap,
  Globe,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

const features = [
  {
    icon: Bitcoin,
    title: 'Multi-Token Wrapping',
    description: 'Wrap various BTC-pegged tokens (WBTC, etc.) into unified SovaBTC',
    color: 'text-orange-500'
  },
  {
    icon: ArrowLeftRight,
    title: 'Cross-Chain Bridge',
    description: 'Bridge SovaBTC across Base, Ethereum, and Sova networks using LayerZero',
    color: 'text-blue-500'
  },
  {
    icon: Coins,
    title: 'Redemption Queue',
    description: 'Queue-based redemption system with configurable delays for enhanced security',
    color: 'text-green-500'
  },
  {
    icon: TrendingUp,
    title: 'Staking Rewards',
    description: 'Stake SovaBTC and SOVA tokens to earn protocol rewards',
    color: 'text-purple-500'
  },
  {
    icon: Shield,
    title: 'Custodial Security',
    description: 'Advanced custody controls and emergency pause functionality',
    color: 'text-red-500'
  },
  {
    icon: Zap,
    title: 'Immediate BTC Withdrawal',
    description: 'Direct Bitcoin withdrawals available on Sova network',
    color: 'text-yellow-500'
  }
]

const supportedNetworks = [
  {
    name: 'Base Sepolia',
    description: 'Primary testnet deployment',
    features: ['Token Wrapping', 'Cross-chain Bridge', 'Staking'],
    status: 'active'
  },
  {
    name: 'Ethereum Sepolia', 
    description: 'Secondary testnet support',
    features: ['Cross-chain Bridge', 'Token Redemption'],
    status: 'active'
  },
  {
    name: 'Sova Testnet',
    description: 'Native Bitcoin integration',
    features: ['BTC Withdrawal', 'Native Staking'],
    status: 'coming-soon'
  }
]

const steps = [
  {
    step: '01',
    title: 'Connect Wallet',
    description: 'Connect your wallet and switch to a supported network'
  },
  {
    step: '02', 
    title: 'Wrap Tokens',
    description: 'Deposit BTC-pegged tokens to receive SovaBTC'
  },
  {
    step: '03',
    title: 'Bridge & Stake',
    description: 'Bridge across chains or stake to earn rewards'
  },
  {
    step: '04',
    title: 'Redeem',
    description: 'Queue redemptions or withdraw directly on Sova'
  }
]

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-sova-subtle dark:from-sova-black-900/20 dark:to-sova-black-800/20" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-sova-mint-100 text-sova-mint-800 border-sova-mint-200" variant="secondary">
              🎉 Now Live on Base Sepolia Testnet
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-sova-black dark:text-sova-mint-100">Multi-Chain</span>
              <span className="text-gradient-sova">
                {' '}Bitcoin-Backed{' '}
              </span>
              <span className="text-sova-black dark:text-sova-mint-100">Tokens</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Wrap BTC tokens into SovaBTC, bridge seamlessly across chains with LayerZero, 
              and earn rewards through staking. Built for security and interoperability.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <RequireWallet>
                <Link href="/wrap">
                  <Button size="lg" className="btn-sova-primary flex items-center gap-2 shadow-sova-lg">
                    <Bitcoin className="w-5 h-5" />
                    Start Wrapping
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </RequireWallet>
              
              <Link href="/portfolio">
                <Button variant="outline" size="lg" className="flex items-center gap-2 border-sova-mint-500 text-sova-mint-600 hover:bg-sova-mint-50">
                  <TrendingUp className="w-5 h-5" />
                  View Portfolio
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Supported Networks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">∞</div>
                <div className="text-sm text-muted-foreground">Cross-Chain Transfers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">10 days</div>
                <div className="text-sm text-muted-foreground">Redemption Delay</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Protocol Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              SovaBTC provides a comprehensive suite of tools for Bitcoin token management across multiple chains
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-background border flex items-center justify-center mb-4 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with SovaBTC in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-sova text-sova-black font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-sova">
                  {step.step}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-sova-black dark:text-sova-mint-100">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <RequireWallet>
              <Link href="/wrap">
                <Button size="lg" className="flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </RequireWallet>
          </div>
        </div>
      </section>

      {/* Supported Networks */}
      <section className="py-20 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Supported Networks</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              SovaBTC operates across multiple blockchain networks for maximum accessibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportedNetworks.map((network, index) => (
              <Card key={index} className={`relative ${network.status === 'coming-soon' ? 'opacity-75' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>{network.name}</CardTitle>
                    <Badge variant={network.status === 'active' ? 'default' : 'secondary'}>
                      {network.status === 'active' ? 'Live' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <CardDescription>{network.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {network.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-sova w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center text-sova-black">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join the future of cross-chain Bitcoin tokens. Wrap, bridge, stake, and earn with SovaBTC.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RequireWallet>
                <Link href="/wrap">
                  <Button size="lg" variant="secondary" className="flex items-center gap-2 bg-sova-black text-sova-mint-100 hover:bg-sova-black/90">
                    <Bitcoin className="w-5 h-5" />
                    Launch App
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </RequireWallet>
              
              <Button size="lg" variant="outline" className="bg-transparent border-sova-black text-sova-black hover:bg-sova-black/10">
                <Globe className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
