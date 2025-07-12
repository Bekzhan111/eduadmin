'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookEditor } from '@/components/book-editor/BookEditor';

export default function BookEditorPage() {
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('section');
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookEditor sectionId={sectionId} />
    </Suspense>
  );
} 
