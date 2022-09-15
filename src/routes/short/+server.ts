import { error, type RequestEvent } from '@sveltejs/kit';
import { default as Shortener } from "$lib/shorten";

const shortener = new Shortener();

export async function GET(event: RequestEvent) {
    const params = event.url.searchParams;
    const short = params.get("from");
    if (short === null) {
        throw error(400, "from must be set");
    } else {
        const long = await shortener.unshorten(short);
        return new Response(long);
    }
}

export async function POST(event: RequestEvent) {
    let value = await event.request.text();
    return new Response(await shortener.shorten(value));
}