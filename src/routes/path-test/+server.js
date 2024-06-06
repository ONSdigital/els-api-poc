const dir = process.cwd();

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    return new Response(dir);
}