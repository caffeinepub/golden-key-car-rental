import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import { useGetBlogPost } from '../hooks/useQueries';

export default function BlogDetailPage() {
  const { postId } = useParams({ from: '/blog/$postId' });
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: post, isLoading, isError } = useGetBlogPost(postId);

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Skeleton className="h-72 bg-charcoal-mid rounded-lg mb-8" />
          <Skeleton className="h-8 bg-charcoal-mid rounded mb-4 w-3/4" />
          <Skeleton className="h-4 bg-charcoal-mid rounded mb-2" />
          <Skeleton className="h-4 bg-charcoal-mid rounded mb-2 w-5/6" />
          <Skeleton className="h-4 bg-charcoal-mid rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Post not found.</p>
          <Button onClick={() => navigate({ to: '/blog' })} className="bg-gold text-deep-black">
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = post.coverImage ? post.coverImage.getDirectURL() : null;

  return (
    <div className="min-h-screen py-8">
      {/* Hero Image */}
      {imageUrl && (
        <div className="w-full h-72 md:h-96 overflow-hidden mb-8">
          <img
            src={imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 max-w-3xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/blog' })}
          className="mb-6 text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="w-4 h-4 me-2" />
          Back to Blog
        </Button>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Calendar className="w-4 h-4 text-gold" />
          <span>
            {t.blog.publishDate}{' '}
            {new Date(Number(post.publishDate) / 1_000_000).toLocaleDateString()}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
          {post.title}
        </h1>

        {/* Divider */}
        <div className="w-16 h-0.5 bg-gold mb-8" />

        {/* Content */}
        <div
          className="prose prose-invert prose-gold max-w-none text-muted-foreground leading-relaxed
            prose-headings:font-serif prose-headings:text-foreground
            prose-a:text-gold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-blockquote:border-gold"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <Button
            onClick={() => navigate({ to: '/blog' })}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <ArrowLeft className="w-4 h-4 me-2" />
            Back to Blog
          </Button>
        </div>
      </div>
    </div>
  );
}
