'use client';

import { Suspense } from 'react';
import { BookEditor } from '@/components/book-editor/BookEditor';

export default function BookEditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookEditor />
    </Suspense>
  );
} 
