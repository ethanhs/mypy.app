import * as Sentry from '@sentry/browser';

export async function logBreadcrumb(breadcrumb: { category: string; message: string; level: any }) {
	console.log(breadcrumb.message);
	Sentry.addBreadcrumb(breadcrumb);
}
