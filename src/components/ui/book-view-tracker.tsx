'use client';

import { useEffect } from 'react';
// import { trackBookView } from '@/utils/book-views';

interface BookViewTrackerProps {
  bookId: string;
}

export default function BookViewTracker({ bookId }: BookViewTrackerProps) {
  useEffect(() => {
    if (bookId) {
      // For now, just log the view tracking
      console.log(`📖 Book view tracked for book ID: ${bookId}`);
      
      // TODO: Uncomment when migration is complete
      // trackBookView(bookId);
    }
  }, [bookId]);

  // This component doesn't render anything
  return null;
} 