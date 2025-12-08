'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

import { cn } from '@/lib/utils';

export interface TableCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

export function TableCard({
  title,
  children,
  actions,
  className,
  contentClassName,
  headerClassName,
}: TableCardProps) {
  return (
    <Card className={className}>
      <CardHeader className={cn('pb-2', headerClassName)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn('p-0', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
