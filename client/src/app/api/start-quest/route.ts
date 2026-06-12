export async function POST(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const body = await req.json();

  const res = await fetch(`${baseUrl}/start-quest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}