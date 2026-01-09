'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Play, 
  Sparkles, 
  Zap, 
  CheckCircle, 
  Star, 
  Users, 
  Globe, 
  Mic,
  Video,
  BookOpen,
  Award,
  ArrowRight,
  Menu,
  X
} from 'lucide-react'
import { useSession } from 'next-auth/react'

export function LandingPage() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Upload,
      title: 'Multi-Format Upload',
      description: 'Support for PPT, PPTX, PDF, DOCX, and text files with drag-and-drop interface',
      color: 'text-blue-600'
    },
    {
      icon: Sparkles,
      title: 'AI Script Generation',
      description: 'Intelligent script creation with multiple tones and learning levels',
      color: 'text-purple-600'
    },
    {
      icon: Mic,
      title: 'Natural Voice Narration',
      description: 'Human-like voices in multiple languages including Hindi, Tamil, Telugu & more',
      color: 'text-green-600'
    },
    {
      icon: Video,
      title: 'Professional Video Output',
      description: 'HD quality videos with smooth transitions and effects',
      color: 'text-red-600'
    },
    {
      icon: Globe,
      title: 'Multi-language Support',
      description: 'Create videos in English, Hindi, Hinglish and regional languages',
      color: 'text-orange-600'
    },
    {
      icon: BookOpen,
      title: 'Educator Tools',
      description: 'Course builder, assessments, certificates and analytics',
      color: 'text-indigo-600'
    }
  ]

  const pricingPlans = [
    {
      name: 'Free',
      price: '₹0',
      description: 'Perfect for trying out VideoShiksha',
      features: [
        '3 video credits per month',
        'Basic quality (720p)',
        'Watermarked videos',
        '1 language support',
        'Basic templates'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Starter',
      price: '₹99',
      description: 'For individual creators and educators',
      features: [
        '50 video credits per month',
        'HD quality (1080p)',
        'No watermark',
        '5 languages support',
        'Premium templates',
        'Basic analytics'
      ],
      cta: 'Get Started',
      popular: true
    },
    {
      name: 'Creator',
      price: '₹299',
      description: 'For professional content creators',
      features: [
        '200 video credits per month',
        '4K quality support',
        'No watermark',
        'All languages',
        'Custom branding',
        'Advanced analytics',
        'Priority support'
      ],
      cta: 'Start Creating',
      popular: false
    }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Mathematics Teacher',
      school: 'Delhi Public School',
      content: 'VideoShiksha has transformed my teaching. I can now create engaging video lessons in minutes instead of hours.',
      rating: 5,
      avatar: '👩‍🏫'
    },
    {
      name: 'Raj Kumar',
      role: 'Content Creator',
      school: 'EduTech Channel',
      content: 'The AI voice generation is incredible. My students love the natural narration in multiple languages.',
      rating: 5,
      avatar: '👨‍💼'
    },
    {
      name: 'Anjali Patel',
      role: 'Training Manager',
      school: 'Corporate Training Co.',
      content: 'We\'ve reduced our training video production time by 80%. Amazing platform!',
      rating: 5,
      avatar: '👩‍💼'
    }
  ]

  const stats = [
    { label: 'Videos Created', value: '50,000+', icon: Video },
    { label: 'Active Users', value: '10,000+', icon: Users },
    { label: 'Languages Supported', value: '12+', icon: Globe },
    { label: 'Satisfaction Rate', value: '98%', icon: Star }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">VideoShiksha</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 transition">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-slate-900 transition">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-slate-600 hover:text-slate-900 transition">
                Testimonials
              </Link>
              {session ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/(auth)/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/(auth)/register">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <Link href="#features" className="block text-slate-600 hover:text-slate-900">
                Features
              </Link>
              <Link href="#pricing" className="block text-slate-600 hover:text-slate-900">
                Pricing
              </Link>
              <Link href="#testimonials" className="block text-slate-600 hover:text-slate-900">
                Testimonials
              </Link>
              {session ? (
                <Link href="/dashboard">
                  <Button className="w-full">Dashboard</Button>
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link href="/(auth)/login">
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/(auth)/register">
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 text-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Video Creation Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Transform Your Presentations into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}Engaging Videos
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload your PowerPoint presentations and let AI create professional videos with natural narration, 
            smooth transitions, and multilingual support in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 text-lg px-8 py-3">
                  <Upload className="w-5 h-5" />
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/(auth)/register">
                  <Button size="lg" className="gap-2 text-lg px-8 py-3">
                    <Upload className="w-5 h-5" />
                    Start Creating Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/(auth)/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          <p className="text-sm text-slate-500">
            No credit card required • 3 free videos to start • Setup in 2 minutes
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Create Amazing Videos
            </h2>
            <p className="text-lg text-slate-600">
              Powerful AI-driven features that make video creation simple and professional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-slate-900">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How VideoShiksha Works
            </h2>
            <p className="text-lg text-slate-600">
              Create professional videos in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Upload Your Content</h3>
              <p className="text-slate-600">
                Upload your PowerPoint, PDF, or document files. Our AI extracts all content automatically.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">AI Magic Processing</h3>
              <p className="text-slate-600">
                AI generates natural scripts, creates voice narration, and optimizes your content.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Download Your Video</h3>
              <p className="text-slate-600">
                Get your professional video with HD quality, ready to share on any platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600">
              Choose the plan that works best for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${
                plan.popular 
                  ? 'ring-2 ring-primary shadow-lg scale-105' 
                  : 'bg-white/60 backdrop-blur-sm'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-slate-900">
                    {plan.price}
                    <span className="text-lg font-normal text-slate-600">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                  
                  <Link href={session ? "/dashboard/billing" : "/(auth)/register"} className="block mt-6">
                    <Button className={`w-full ${plan.popular ? 'bg-primary' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Loved by Educators and Creators
            </h2>
            <p className="text-lg text-slate-600">
              See what our users have to say about VideoShiksha
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-600">{testimonial.role}</div>
                      <div className="text-xs text-slate-500">{testimonial.school}</div>
                    </div>
                  </div>
                  
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-slate-700 italic">&ldquo;{testimonial.content}&rdquo;</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-0">
            <CardContent className="p-12 text-center">
              <Zap className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Teaching?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of educators and content creators who are already using VideoShiksha 
                to create amazing video content in minutes.
              </p>
              
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-3">
                    <Upload className="w-5 h-5" />
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/(auth)/register">
                  <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-3">
                    <Upload className="w-5 h-5" />
                    Start Creating Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              )}
              
              <p className="text-sm mt-4 opacity-75">
                No credit card required • 3 free videos • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">VideoShiksha</span>
              </div>
              <p className="text-sm">
                Transforming education with AI-powered video creation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition">API Docs</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 VideoShiksha. All rights reserved. Made with ❤️ in India.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}