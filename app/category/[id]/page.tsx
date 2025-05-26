"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import CategoryPage from '@/components/featured/CategoryPage';

export default function CategoryRoute() {
  const params = useParams();
  const categoryId = params.id as string;
  
  return <CategoryPage categoryId={categoryId} />;
}
