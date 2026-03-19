import React from 'react';
import { motion } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  ctaLink?: string;
  ctaText?: string;
  secondaryCtaLink?: string;
  secondaryCtaText?: string;
  videoUrl?: string;
}

export default function Hero({
  title,
  subtitle,
  description,
  imageUrl,
  ctaLink,
  ctaText = 'Explore',
  secondaryCtaLink,
  secondaryCtaText = 'Details',
  videoUrl
}: HeroProps) {
  return (
    <div className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {videoUrl && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-20 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          {subtitle && (
            <span className="text-red-600 font-bold tracking-widest uppercase text-sm mb-2 block">
              {subtitle}
            </span>
          )}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-4">
            {title}
          </h1>
          {description && (
            <p className="text-lg md:text-xl text-gray-300 mb-8 line-clamp-3">
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            {ctaLink && (
              <Link
                to={ctaLink}
                className="flex items-center space-x-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{ctaText}</span>
              </Link>
            )}
            {secondaryCtaLink && (
              <Link
                to={secondaryCtaLink}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-full font-bold hover:bg-white/30 transition-colors"
              >
                <Info className="w-5 h-5" />
                <span>{secondaryCtaText}</span>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
