import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  schemaData?: object;
}

export function SEOHead({
  title = "ContentScale - World's First Autonomous AI Content Writing System",
  description = "Revolutionary autonomous AI content writing system. Replace multiple writers with one editor. Generate SEO-optimized blog posts automatically for businesses worldwide.",
  keywords = "AI content writer, autonomous content writing, AI blog generator, content writing AI, AI copywriter, automated content creation",
  canonical = "https://contentscale.site/",
  ogImage = "https://contentscale.site/og-image.jpg",
  schemaData
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    }
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);
    
    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', content);
    };
    
    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    updateOGTag('og:image', ogImage);
    updateOGTag('og:url', canonical);
    
    // Update Twitter tags
    const updateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[property="twitter:${name}"]`);
      if (!twitterTag) {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('property', `twitter:${name}`);
        document.head.appendChild(twitterTag);
      }
      twitterTag.setAttribute('content', content);
    };
    
    updateTwitterTag('title', title);
    updateTwitterTag('description', description);
    updateTwitterTag('image', ogImage);
    updateTwitterTag('url', canonical);
    
    // Add schema data if provided
    if (schemaData) {
      let schemaScript = document.querySelector('#schema-data');
      if (schemaScript) {
        document.head.removeChild(schemaScript);
      }
      
      schemaScript = document.createElement('script');
      schemaScript.id = 'schema-data';
      schemaScript.type = 'application/ld+json';
      schemaScript.textContent = JSON.stringify(schemaData);
      document.head.appendChild(schemaScript);
    }
    
    // Add AI search engine optimization
    const updateAITag = (name: string, content: string) => {
      let aiTag = document.querySelector(`meta[name="${name}"]`);
      if (!aiTag) {
        aiTag = document.createElement('meta');
        aiTag.setAttribute('name', name);
        document.head.appendChild(aiTag);
      }
      aiTag.setAttribute('content', content);
    };
    
    updateAITag('ai-description', description);
    updateAITag('ai-category', 'AI Writing Software, Content Automation, Business Tools');
    updateAITag('ai-keywords', keywords.split(',').slice(0, 10).join(', '));
    
  }, [title, description, keywords, canonical, ogImage, schemaData]);
  
  return null;
}

// Pre-defined SEO configurations for different pages
export const SEOConfigs = {
  landing: {
    title: "ContentScale - World's First Autonomous AI Content Writing System | Replace Writers with AI",
    description: "Revolutionary autonomous AI content writing system trusted by businesses in USA, Canada, UK, Australia, Europe. Replace multiple writers with one editor. Generate SEO-optimized blog posts, articles automatically. Start free trial.",
    keywords: "AI content writer, autonomous content writing, AI blog generator, content writing AI, AI copywriter, automated content creation, AI writing assistant, content generation AI, AI article writer, SEO content AI, AI content marketing, machine learning content, natural language processing, GPT content writer, AI text generator, content automation, AI powered writing, intelligent content creation, AI content strategy, automated blog writing, AI SEO content, content writing software, AI marketing content, digital content AI, AI content optimization, smart content creation, AI writing tools, content AI platform, automated copywriting, AI content management, intelligent writing assistant, AI driven content, content creation automation, AI text creation, automated article writing, AI content production, smart writing technology, AI content solutions, content writing automation, AI blog creation, automated content marketing, AI writing platform, content generation software, AI content creator, automated writing system, AI content development, intelligent content generator, AI powered copywriting, content automation tools, AI writing service, automated content strategy, replace writers with AI, business content automation, autonomous writing system, AI content scaling, enterprise content AI",
    canonical: "https://contentscale.site/",
    schemaData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "ContentScale - Autonomous AI Content Writing System",
      "description": "World's first autonomous AI content writing system for businesses",
      "url": "https://contentscale.site/",
      "mainEntity": {
        "@type": "SoftwareApplication",
        "name": "ContentScale",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "1200"
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "category": "Free Trial"
        }
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://contentscale.site/"
          }
        ]
      }
    }
  },
  
  admin: {
    title: "ContentScale Admin Panel - AI Content Management System | Autonomous Writing Control",
    description: "Manage your autonomous AI content writing system. Monitor content generation, analytics, user activity, and security settings. Advanced AI content management for business scaling.",
    keywords: "AI content management, content admin panel, AI writing dashboard, autonomous content control, content analytics AI, AI content monitoring, business content management, AI writing analytics, content generation dashboard, AI content security, automated content oversight, content system admin, AI writing management, content automation control, business AI dashboard",
    canonical: "https://contentscale.site/admin",
    schemaData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "ContentScale Admin Panel",
      "description": "Administrative interface for ContentScale AI content writing system",
      "url": "https://contentscale.site/admin",
      "isPartOf": {
        "@type": "WebSite",
        "name": "ContentScale",
        "url": "https://contentscale.site"
      }
    }
  }
};