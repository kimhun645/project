import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  stats?: {
    label: string;
    value: string;
    trend?: {
      value: string;
      isPositive: boolean;
    };
    icon: LucideIcon;
    color?: string;
    gradient?: string;
  }[];
  primaryAction?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
  secondaryActions?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  stats, 
  primaryAction, 
  secondaryActions 
}: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Enhanced Main Header with Professional Design */}
      <Card className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 shadow-2xl border-0 overflow-hidden relative card-entrance">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 blur-3xl pulse-blue"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full translate-y-40 -translate-x-40 blur-3xl pulse-blue delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400/20 rounded-full -translate-x-32 -translate-y-32 blur-2xl pulse-blue delay-500"></div>
        </div>
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full float"></div>
          <div className="absolute top-12 right-12 w-1 h-1 bg-white rounded-full float-delay-1"></div>
          <div className="absolute top-20 right-20 w-3 h-3 bg-white rounded-full float-delay-2"></div>
          <div className="absolute bottom-4 left-4 w-2 h-2 bg-white rounded-full float"></div>
          <div className="absolute bottom-12 left-12 w-1 h-1 bg-white rounded-full float-delay-1"></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 bg-white rounded-full float-delay-2"></div>
        </div>
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                {Icon && (
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg transition-transform duration-300 hover:scale-110">
                    <Icon className="h-8 w-8 md:h-9 md:w-9 text-white" />
                  </div>
                )}
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-5xl font-bold text-white font-thai tracking-tight">
                    {title}
                  </h1>
                  <p className="text-white/90 text-base md:text-xl font-medium max-w-2xl leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto">
              {secondaryActions}
              {primaryAction && (
                <Button 
                  onClick={primaryAction.onClick}
                  size="lg" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg backdrop-blur-sm flex-1 lg:flex-none h-14 px-8 text-lg font-semibold transition-all duration-300 hover:scale-105 btn-animate"
                  variant="outline"
                >
                  <primaryAction.icon className="h-6 w-6 mr-3" />
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Stats Section with Beautiful Cards */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {stats.map((stat, index) => {
            // Check if this is a monetary value card
            const isMonetaryCard = stat.label.includes('มูลค่า') || stat.label.includes('บาท') || stat.value.includes('฿');
            
            // Determine card size based on type
            const cardSize = isMonetaryCard ? 'col-span-2' : 'col-span-1';
            const cardHeight = isMonetaryCard ? 'min-h-[160px]' : 'min-h-[110px]';
            
            // Default gradients for different stat types
            const defaultGradients = [
              'from-blue-600 to-cyan-600',
              'from-emerald-600 to-teal-600', 
              'from-orange-600 to-amber-600',
              'from-purple-600 to-pink-600'
            ];
            
            const gradient = stat.gradient || defaultGradients[index % defaultGradients.length];
            const iconBg = stat.color || `bg-gradient-to-br ${gradient}`;
            
            // Enhanced background colors that match the system theme
            const cardBackgrounds = [
              'stats-card-blue',
              'stats-card-emerald',
              'stats-card-orange',
              'stats-card-purple',
              'stats-card-indigo',
              'stats-card-teal',
              'stats-card-rose',
              'stats-card-violet'
            ];
            
            const cardBackground = cardBackgrounds[index % cardBackgrounds.length];
            
            return (
              <Card 
                key={index} 
                className={`group ${cardBackground} stats-card-glow stats-card-border-glow overflow-hidden relative hover:scale-105 card-entrance animate-delay-${(index + 1) * 100} ${cardSize} ${cardHeight}`}
              >
                {/* Card background decoration */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full -translate-y-16 translate-x-16 blur-2xl opacity-20 float`}></div>
                  <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full translate-y-12 -translate-x-12 blur-xl opacity-20 float-delay-1`}></div>
                </div>
                
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 card-pattern-dots"></div>
                </div>
                
                <div className="stats-card-content">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`stats-card-icon ${iconBg} ${isMonetaryCard ? 'scale-110' : 'scale-100'}`}>
                      <stat.icon className={`${isMonetaryCard ? 'h-7 w-7' : 'h-5 w-5'} text-white`} />
                    </div>
                    {stat.trend && (
                      <Badge 
                        variant="secondary"
                        className={`text-xs font-bold px-3 py-1 transition-all duration-300 ${
                          stat.trend.isPositive 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {stat.trend.isPositive ? '↗' : '↘'} {stat.trend.value}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className={`stats-card-label ${isMonetaryCard ? 'text-base' : 'text-xs'}`}>
                      {stat.label}
                    </p>
                    <p className={`stats-card-value ${isMonetaryCard ? 'text-3xl' : 'text-lg'} font-bold`}>
                      {stat.value}
                    </p>
                  </div>
                  
                  {/* Hover effect line */}
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${gradient} w-0 group-hover:w-full transition-all duration-500 ease-out`}></div>
                  
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="shimmer absolute inset-0"></div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}