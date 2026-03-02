import React from 'react';
import { Link } from '@tanstack/react-router';
import { Calendar, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import { useGetBlogPosts } from '../hooks/useQueries';

export default function BlogListingPage() {
  const { t } = useLanguage();
  const { data: posts = [], isLoading } = useGetBlogPosts();

  const sorted = [...posts].sort(
    (a, b) => Number(b.publishDate) - Number(a.publishDate)
  );

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">{t.blog.title}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t.blog.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-72 bg-charcoal-mid rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <img
              src="/assets/generated/empty-state-icon.dim_256x256.png"
              alt="No posts"
              className="w-24 h-24 mx-auto mb-4 opacity-40"
            />
            <h3 className="font-serif text-xl text-foreground mb-2">{t.blog.noPosts}</h3>
            <p className="text-muted-foreground">{t.blog.noPostsDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map(post => {
              const imageUrl = post.coverImage ? post.coverImage.getDirectURL() : null;
              return (
                <Link
                  key={post.id}
                  to="/blog/$postId"
                  params={{ postId: post.id }}
                  className="block group"
                >
                  <article className="luxury-card transition-all duration-300 group-hover:border-gold/40 group-hover:-translate-y-1">
                    {/* Cover Image */}
                    <div className="h-48 bg-charcoal-mid overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-charcoal to-charcoal-mid">
                          <span className="text-5xl opacity-30">📰</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="w-3.5 h-3.5 text-gold" />
                        <span>
                          {t.blog.publishDate}{' '}
                          {new Date(Number(post.publishDate) / 1_000_000).toLocaleDateString()}
                        </span>
                      </div>

                      <h2 className="font-serif text-lg font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2 mb-3">
                        {post.title}
                      </h2>

                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {post.content.replace(/<[^>]*>/g, '').slice(0, 150)}
                        {post.content.length > 150 ? '...' : ''}
                      </p>

                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gold group-hover:gap-2 transition-all">
                        {t.blog.readMore}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
