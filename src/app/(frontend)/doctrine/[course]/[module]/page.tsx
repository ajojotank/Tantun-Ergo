import { permanentRedirect } from 'next/navigation';

type PageParams = { course: string; module: string };

export default async function ModuleRedirectPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { course, module } = await params;
  permanentRedirect(`/doctrine/${course}#module-${module}`);
}
