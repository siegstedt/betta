import { redirect } from 'next/navigation';

// This page just redirects to the default 'overview' tab.
export default async function ActivityRootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/activity/${id}/overview`);
}
