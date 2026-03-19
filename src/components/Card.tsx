import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface CardProps {
  key?: string | number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  href: string;
  className?: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
}

export default function Card({ title, subtitle, imageUrl, href, className, aspectRatio = 'landscape' }: CardProps) {
  const aspectClasses = {
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-video',
    square: 'aspect-square',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn("group relative overflow-hidden rounded-2xl bg-zinc-900", className)}
    >
      <Link to={href}>
        <div className={cn("relative w-full overflow-hidden", aspectClasses[aspectRatio])}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold text-white leading-tight group-hover:text-red-500 transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
